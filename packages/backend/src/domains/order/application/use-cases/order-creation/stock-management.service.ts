//  "stock-management.service.ts"
//  metropolitan backend
//  Stock validation and reservation logic extracted from OrderCreationService

import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";
import { eq, sql } from "drizzle-orm";
import { products } from "../../../../../shared/infrastructure/database/schema";

export class StockManagementService {
  /**
   * CRITICAL: Stock validation and reservation with Redis
   * Prevents race conditions and over-selling using distributed locking
   */
  static async validateAndReserveStock(
    tx: any,
    orderItemsData: OrderItemData[]
  ): Promise<void> {
    // Try Redis-based reservation first (faster + distributed locking)
    const redisReservations: {
      productId: string;
      userId: string;
      success: boolean;
    }[] = [];

    try {
      // Import Redis service dynamically to avoid dependency issues
      const { RedisStockService } = await import(
        "../../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const item of orderItemsData) {
        const productId = item.product.id;
        const requestedQuantity = item.quantity;
        const userId = "temp-user"; // Will be replaced with actual userId

        console.log(`🔄 Attempting Redis stock reservation for ${productId}`);

        const reservation = await RedisStockService.reserveStockAtomic(
          productId,
          userId,
          requestedQuantity
        );

        redisReservations.push({
          productId,
          userId,
          success: reservation.success,
        });

        if (!reservation.success) {
          // Rollback any successful reservations before throwing
          await this.rollbackRedisReservations(
            redisReservations.filter((r) => r.success)
          );
          throw new Error(
            JSON.stringify({
              code: "INSUFFICIENT_STOCK",
              message: "Stok yetersiz",
              productId: productId,
              error: reservation.error,
            })
          );
        }

        console.log(
          `✅ Redis stock reserved: ${productId} - Remaining: ${reservation.remainingStock}`
        );
      }

      // If Redis succeeds, also update database for consistency
      await this.syncDatabaseWithRedisReservations(
        tx,
        orderItemsData,
        redisReservations
      );
    } catch (redisError) {
      console.warn(
        "Redis stock reservation failed, falling back to database:",
        redisError
      );

      // Check if this is an insufficient stock error that should be rethrown
      if (
        redisError.message &&
        redisError.message.includes("INSUFFICIENT_STOCK")
      ) {
        throw redisError; // Re-throw the stock error
      }

      // Fallback to database-only reservation for other errors
      await this.fallbackDatabaseStockReservation(tx, orderItemsData);
    }
  }

  /**
   * Fallback database stock reservation (original method)
   */
  private static async fallbackDatabaseStockReservation(
    tx: any,
    orderItemsData: OrderItemData[]
  ): Promise<void> {
    for (const item of orderItemsData) {
      const productId = item.product.id;
      const requestedQuantity = item.quantity;

      // Atomic stock check and reservation using SQL
      const [result] = await tx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${requestedQuantity}`,
          updatedAt: new Date(),
        })
        .where(
          sql`${products.id} = ${productId} AND ${products.stock} >= ${requestedQuantity}`
        )
        .returning({
          id: products.id,
          name: products.name,
          newStock: products.stock,
        });

      // If no rows affected, stock was insufficient
      if (!result) {
        // Get current stock for error message
        const [currentProduct] = await tx
          .select({
            name: products.name,
            stock: products.stock,
          })
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);

        const productName = currentProduct?.name || `Product ${productId}`;
        const currentStock = currentProduct?.stock || 0;

        throw new Error(
          `Insufficient stock for ${productName}. Requested: ${requestedQuantity}, Available: ${currentStock}`
        );
      }

      console.log(
        `✅ Database stock reserved: ${result.name} - Quantity: ${requestedQuantity}, Remaining: ${result.newStock}`
      );
    }
  }

  /**
   * Sync database with Redis reservations for consistency
   */
  private static async syncDatabaseWithRedisReservations(
    tx: any,
    orderItemsData: OrderItemData[],
    redisReservations: { productId: string; userId: string; success: boolean }[]
  ): Promise<void> {
    for (const item of orderItemsData) {
      const reservation = redisReservations.find(
        (r) => r.productId === item.product.id
      );
      if (reservation?.success) {
        // Update database to match Redis state
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.product.id));

        console.log(
          `🔄 Database synced with Redis for product ${item.product.id}`
        );
      }
    }
  }

  /**
   * Rollback Redis reservations in case of failure
   */
  private static async rollbackRedisReservations(
    reservations: { productId: string; userId: string; success: boolean }[]
  ): Promise<void> {
    try {
      const { RedisStockService } = await import(
        "../../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const reservation of reservations) {
        await RedisStockService.rollbackReservation(
          reservation.userId,
          reservation.productId
        );
        console.log(
          `🔄 Redis reservation rolled back: ${reservation.productId}`
        );
      }
    } catch (error) {
      console.error("Failed to rollback Redis reservations:", error);
    }
  }

  /**
   * Rollback stock if order fails (called from webhook on payment failure)
   */
  static async rollbackStock(orderId: string): Promise<void> {
    const { db } = await import("../../../../../shared/infrastructure/database/connection");
    const { orderItems, orders } = await import("../../../../../shared/infrastructure/database/schema");

    await db.transaction(async (tx) => {
      // Get order items that need stock rollback
      const orderItemsToRollback = await tx
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Rollback stock for each item
      for (const item of orderItemsToRollback) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));

        console.log(
          `🔄 Stock rolled back: Product ${item.productId} + ${item.quantity}`
        );
      }

      // Mark order as cancelled
      await tx
        .update(orders)
        .set({
          status: "cancelled",
          paymentStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`❌ Order cancelled and stock rolled back: ${orderId}`);
    });
  }
}