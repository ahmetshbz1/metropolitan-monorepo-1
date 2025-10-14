//  "stock-redis-operations.service.ts"
//  metropolitan backend
//  Redis-specific stock operations separated from StockManagementService

import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";

import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";

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

      logger.info({ productId, userId, quantity: requestedQuantity }, "Attempting Redis stock reservation");

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
        logger.warn({ productId, error: reservation.error }, "Redis reservation failed");
        break; // Stop attempting further reservations
      }

      logger.info({ productId, remainingStock: reservation.remainingStock }, "Redis stock reserved successfully");
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
        logger.info({ productId: reservation.productId, userId: reservation.userId }, "Redis reservation rolled back");
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Failed to rollback Redis reservations");
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
          logger.info({ productId: item.product.id, userId }, "Redis reservation rolled back from data");
        } catch (error) {
          logger.error({ productId: item.product.id, userId, error: error instanceof Error ? error.message : String(error) }, "Failed to rollback Redis reservation for product");
        }
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Failed to rollback Redis reservations from data");
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
            logger.info({ productId: item.product.id, stock: product.stock }, "Redis synced with database");
          }
        } catch (error) {
          logger.error({ productId: item.product.id, error: error instanceof Error ? error.message : String(error) }, "Failed to sync Redis for product");
        }
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Failed to sync Redis with database fallback");
    }
  }
}