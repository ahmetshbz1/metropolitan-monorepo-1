//  "stock-redis-operations.service.ts"
//  metropolitan backend
//  Redis-specific stock operations separated from StockManagementService

import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";

export interface RedisReservation {
  productId: string;
  userId: string;
  success: boolean;
}

export class StockRedisOperationsService {
  /**
   * Attempts to reserve stock for all items using Redis
   */
  static async reserveStockInRedis(
    orderItemsData: OrderItemData[],
    userId: string = "temp-user"
  ): Promise<{
    reservations: RedisReservation[];
    allSuccessful: boolean;
  }> {
    const { RedisStockService } = await import(
      "../../../../../shared/infrastructure/cache/redis-stock.service"
    );

    const reservations: RedisReservation[] = [];

    for (const item of orderItemsData) {
      const productId = item.product.id;
      const requestedQuantity = item.quantity;

      console.log(`🔄 Attempting Redis stock reservation for ${productId}`);

      const reservation = await RedisStockService.reserveStockAtomic(
        productId,
        userId,
        requestedQuantity
      );

      reservations.push({
        productId,
        userId,
        success: reservation.success,
      });

      if (!reservation.success) {
        console.log(
          `❌ Redis reservation failed for ${productId}: ${reservation.error}`
        );
        break; // Stop attempting further reservations
      }

      console.log(
        `✅ Redis stock reserved: ${productId} - Remaining: ${reservation.remainingStock}`
      );
    }

    return {
      reservations,
      allSuccessful: reservations.every((r) => r.success),
    };
  }

  /**
   * Rollback Redis reservations
   */
  static async rollbackReservations(
    reservations: RedisReservation[]
  ): Promise<void> {
    try {
      const { RedisStockService } = await import(
        "../../../../../shared/infrastructure/cache/redis-stock.service"
      );

      const successfulReservations = reservations.filter((r) => r.success);

      for (const reservation of successfulReservations) {
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
   * Rollback Redis reservations from order items data (database transaction failed)
   * Used when we need to rollback without having reservation objects
   */
  static async rollbackReservationsFromData(
    orderItemsData: OrderItemData[],
    userId: string
  ): Promise<void> {
    try {
      const { RedisStockService } = await import(
        "../../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const item of orderItemsData) {
        try {
          await RedisStockService.rollbackReservation(userId, item.product.id);
          console.log(`🔄 Redis reservation rolled back: ${item.product.id}`);
        } catch (error) {
          console.error(`Failed to rollback Redis reservation for ${item.product.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to rollback Redis reservations from data:", error);
    }
  }

  /**
   * Sync Redis with database fallback (when Redis fails, database succeeds)
   * Decrements Redis stock to match database state
   */
  static async syncRedisWithDatabaseFallback(
    orderItemsData: OrderItemData[]
  ): Promise<void> {
    try {
      const { db } = await import("../../../../../shared/infrastructure/database/connection");
      const { products } = await import("../../../../../shared/infrastructure/database/schema");
      const { eq } = await import("drizzle-orm");
      const { RedisStockService } = await import(
        "../../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const item of orderItemsData) {
        try {
          const [product] = await db
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, item.product.id))
            .limit(1);

          if (product) {
            await RedisStockService.setStockLevel(item.product.id, product.stock);
            console.log(`🔄 Redis synced with database: ${item.product.id} = ${product.stock}`);
          }
        } catch (error) {
          console.error(`Failed to sync Redis for ${item.product.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to sync Redis with database fallback:", error);
    }
  }
}