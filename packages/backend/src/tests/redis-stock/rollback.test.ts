// "rollback.test.ts"
// Redis stock rollback mechanism tests

import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { MockRedisStockService } from '../mocks/redis-stock.service.mock';

describe("🔄 Redis Rollback Mechanism Tests", () => {
  
  beforeAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🔧 Redis mock initialized for rollback testing");
  });

  afterAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🧹 Redis mock cleaned up");
  });

  test("Basic rollback mechanism", async () => {
    console.log("\n🎯 Testing Redis rollback mechanism...");
    
    const productId = "redis-test-product-2";
    const userId = "test-user";
    
    await MockRedisStockService.syncStockFromDB(productId, 5);
    console.log(`📦 Initial stock: ${await MockRedisStockService.getCurrentStock(productId)}`);
    
    // Reserve stock
    const reservation = await MockRedisStockService.reserveStockAtomic(productId, userId, 2);
    expect(reservation.success).toBe(true);
    console.log(`📉 After reservation: ${await MockRedisStockService.getCurrentStock(productId)}`);
    
    // Rollback
    await MockRedisStockService.rollbackReservation(userId, productId);
    console.log(`📈 After rollback: ${await MockRedisStockService.getCurrentStock(productId)}`);
    
    expect(await MockRedisStockService.getCurrentStock(productId)).toBe(5);
    
    console.log("🎉 Redis rollback mechanism PASSED!");
  });

  test("Multiple rollbacks scenario", async () => {
    console.log("\n🎯 Testing multiple rollbacks...");
    
    const productId = "redis-multi-rollback";
    const initialStock = 10;
    
    await MockRedisStockService.syncStockFromDB(productId, initialStock);
    
    // Multiple users reserve stock
    const reservations = [
      { userId: "user-1", quantity: 3 },
      { userId: "user-2", quantity: 2 },
      { userId: "user-3", quantity: 1 }
    ];
    
    // Make reservations
    for (const { userId, quantity } of reservations) {
      const result = await MockRedisStockService.reserveStockAtomic(productId, userId, quantity);
      expect(result.success).toBe(true);
    }
    
    const afterReservations = await MockRedisStockService.getCurrentStock(productId);
    console.log(`📉 Stock after all reservations: ${afterReservations}`);
    expect(afterReservations).toBe(4); // 10 - 3 - 2 - 1 = 4
    
    // Rollback user-2's reservation
    await MockRedisStockService.rollbackReservation("user-2", productId);
    const afterFirstRollback = await MockRedisStockService.getCurrentStock(productId);
    console.log(`📈 Stock after user-2 rollback: ${afterFirstRollback}`);
    expect(afterFirstRollback).toBe(6); // 4 + 2 = 6
    
    // Rollback user-1's reservation
    await MockRedisStockService.rollbackReservation("user-1", productId);
    const afterSecondRollback = await MockRedisStockService.getCurrentStock(productId);
    console.log(`📈 Stock after user-1 rollback: ${afterSecondRollback}`);
    expect(afterSecondRollback).toBe(9); // 6 + 3 = 9
    
    console.log("🎉 Multiple rollbacks test PASSED!");
  });

  test("Rollback non-existent reservation", async () => {
    console.log("\n🎯 Testing rollback of non-existent reservation...");
    
    const productId = "redis-nonexistent-rollback";
    await MockRedisStockService.syncStockFromDB(productId, 5);
    
    const initialStock = await MockRedisStockService.getCurrentStock(productId);
    
    // Try to rollback a reservation that doesn't exist
    await MockRedisStockService.rollbackReservation("non-existent-user", productId);
    
    const finalStock = await MockRedisStockService.getCurrentStock(productId);
    
    // Stock should remain unchanged
    expect(finalStock).toBe(initialStock);
    
    console.log("🎉 Non-existent reservation rollback test PASSED!");
  });
});