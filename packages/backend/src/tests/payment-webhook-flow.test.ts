//  "payment-webhook-flow.test.ts"
//  metropolitan backend
//  E2E tests for payment webhook flow and Redis confirmation

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { redis } from "../shared/infrastructure/database/redis";
import { db } from "../shared/infrastructure/database/connection";
import { products, users, orders, orderItems } from "../shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { RedisStockService } from "../shared/infrastructure/cache/redis-stock.service";
import { PaymentStateHandlersService } from "../domains/payment/application/webhook/payment-state-handlers.service";
import { WebhookStockRollbackService } from "../domains/payment/application/webhook/stock-rollback.service";

let testProductId: string;
let testUserId: string;
let testOrderId: string;

describe("Payment Webhook Flow", () => {
  beforeAll(async () => {
    console.log("🚀 Starting payment webhook flow tests...");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        phoneNumber: "+905551111111",
        userType: "individual",
        firstName: "Test",
        lastName: "Payment User",
      })
      .returning();
    testUserId = user.id;

    // Create test product
    const [product] = await db
      .insert(products)
      .values({
        productCode: "PAYMENT-TEST-001",
        price: "150.00",
        stock: 200,
        tax: 23,
        individualPrice: "150.00",
        corporatePrice: "140.00",
      })
      .returning();
    testProductId = product.id;

    // Sync Redis
    await RedisStockService.syncStockFromDB(testProductId, 200);
  });

  afterAll(async () => {
    // Cleanup
    try {
      await db.delete(orderItems);
      if (testOrderId) {
        await db.delete(orders).where(eq(orders.id, testOrderId));
      }
      await db.delete(orders).where(eq(orders.userId, testUserId));
      await db.delete(products).where(eq(products.id, testProductId));
      await db.delete(users).where(eq(users.id, testUserId));
      await redis.del(`stock:${testProductId}`);
      await redis.del(`reservation:${testUserId}:${testProductId}`);
    } catch (error) {
      console.error("Cleanup error:", error);
    }
    console.log("✅ Payment webhook flow tests completed!");
  });

  beforeEach(async () => {
    // Reset stock
    await db
      .update(products)
      .set({ stock: 200 })
      .where(eq(products.id, testProductId));
    await RedisStockService.setStockLevel(testProductId, 200);
  });

  describe("1. Redis Reservation Confirmation", () => {
    it("should confirm Redis reservation after successful payment", async () => {
      // Reserve stock (simulating order creation)
      const reservation = await RedisStockService.reserveStockAtomic(
        testProductId,
        testUserId,
        15
      );

      expect(reservation.success).toBe(true);
      expect(reservation.remainingStock).toBe(185);

      // Confirm reservation (simulating payment success)
      await RedisStockService.confirmReservation(testUserId, testProductId);

      // Verify reservation is confirmed
      const reservationKey = `reservation:${testUserId}:${testProductId}`;
      const reservationData = await redis.get(reservationKey);

      expect(reservationData).not.toBeNull();
      if (reservationData) {
        const reservationObj = JSON.parse(reservationData);
        expect(reservationObj.status).toBe("confirmed");
        console.log("✅ Redis reservation confirmed");
      }

      // Verify stock levels
      const redisStock = await RedisStockService.getCurrentStock(testProductId);
      expect(redisStock).toBe(185);
    });
  });

  describe("2. Stock Rollback", () => {
    it("should rollback stock on payment failure", async () => {
      // Reserve stock
      await RedisStockService.reserveStockAtomic(testProductId, testUserId, 20);
      const afterReserve = await RedisStockService.getCurrentStock(testProductId);
      expect(afterReserve).toBe(180);

      // Rollback (simulating payment failure)
      await RedisStockService.rollbackReservation(testUserId, testProductId);

      // Verify stock is rolled back
      const afterRollback = await RedisStockService.getCurrentStock(testProductId);
      expect(afterRollback).toBe(200);

      // Verify reservation status
      const reservationKey = `reservation:${testUserId}:${testProductId}`;
      const reservationData = await redis.get(reservationKey);

      if (reservationData) {
        const reservationObj = JSON.parse(reservationData);
        expect(reservationObj.status).toBe("rolled_back");
        console.log("✅ Stock rollback successful");
      }
    });

    it("should handle multiple product rollback", async () => {
      // Create second test product with unique code
      const uniqueCode = `PAYMENT-TEST-${Date.now()}`;
      const [product2] = await db
        .insert(products)
        .values({
          productCode: uniqueCode,
          price: "200.00",
          stock: 150,
          tax: 23,
          individualPrice: "200.00",
          corporatePrice: "180.00",
        })
        .returning();

      await RedisStockService.syncStockFromDB(product2.id, 150);

      // Reserve both products
      await RedisStockService.reserveStockAtomic(testProductId, testUserId, 10);
      await RedisStockService.reserveStockAtomic(product2.id, testUserId, 5);

      const stock1 = await RedisStockService.getCurrentStock(testProductId);
      const stock2 = await RedisStockService.getCurrentStock(product2.id);

      expect(stock1).toBe(190);
      expect(stock2).toBe(145);

      // Rollback both
      await RedisStockService.rollbackReservation(testUserId, testProductId);
      await RedisStockService.rollbackReservation(testUserId, product2.id);

      // Both stocks should be rolled back
      const finalStock1 = await RedisStockService.getCurrentStock(testProductId);
      const finalStock2 = await RedisStockService.getCurrentStock(product2.id);

      expect(finalStock1).toBe(200);
      expect(finalStock2).toBe(150);
      console.log("✅ Multi-product rollback successful");

      // Cleanup
      await db.delete(products).where(eq(products.id, product2.id));
      await redis.del(`stock:${product2.id}`);
    });
  });
});
