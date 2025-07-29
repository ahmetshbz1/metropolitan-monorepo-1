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
}