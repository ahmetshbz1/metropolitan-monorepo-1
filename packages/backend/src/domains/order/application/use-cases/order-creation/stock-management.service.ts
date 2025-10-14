//  "stock-management.service.ts"
//  metropolitan backend
//  Orchestrates stock validation and reservation using specialized services

import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";

import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";
import { StockDatabaseSyncService } from "./stock-database-sync.service";
import { StockRedisOperationsService } from "./stock-redis-operations.service";
import { StockValidationService } from "./stock-validation.service";

export class StockManagementService {
  /**
   * CRITICAL: Stock validation and reservation with Redis
   * Prevents race conditions and over-selling using distributed locking
   */
  static async validateAndReserveStock(
    tx: any,
    orderItemsData: OrderItemData[],
    userId: string
  ): Promise<void> {
    try {
      // Try Redis-based reservation first (faster + distributed locking)
      const { reservations, allSuccessful } = await StockRedisOperationsService
        .reserveStockInRedis(orderItemsData, userId);

      if (!allSuccessful) {
        // Rollback any successful reservations before throwing
        await StockRedisOperationsService.rollbackReservations(reservations);
        
        const failedReservation = reservations.find(r => !r.success);
        throw StockValidationService.createInsufficientStockError(
          failedReservation?.productId || "unknown"
        );
      }

      // If Redis succeeds, also update database for consistency
      await StockDatabaseSyncService.syncWithRedisReservations(
        tx,
        orderItemsData,
        reservations
      );
    } catch (redisError) {
      logger.warn({
        error: redisError instanceof Error ? redisError.message : String(redisError),
        stack: redisError instanceof Error ? redisError.stack : undefined
      }, "Redis stock reservation failed, falling back to database");

      // Check if this is an insufficient stock error that should be rethrown
      if (
        redisError instanceof Error &&
        redisError.message &&
        redisError.message.includes("INSUFFICIENT_STOCK")
      ) {
        throw redisError; // Re-throw the stock error
      }

      // Fallback to database-only reservation for other errors
      await StockDatabaseSyncService.reserveStockInDatabase(tx, orderItemsData);

      // Sync Redis with database fallback results
      try {
        await StockRedisOperationsService.syncRedisWithDatabaseFallback(orderItemsData);
        logger.info("Redis synced with database fallback");
      } catch (syncError) {
        logger.warn({
          error: syncError instanceof Error ? syncError.message : String(syncError)
        }, "Failed to sync Redis with database fallback");
      }
    }
  }

  /**
   * Rollback stock if order fails (called from webhook on payment failure)
   * @deprecated Use WebhookStockRollbackService.rollbackOrderStock() instead
   */
  static async rollbackStock(orderId: string): Promise<void> {
    // This method is kept for backward compatibility
    // The actual implementation has been moved to WebhookStockRollbackService
    const { WebhookStockRollbackService } = await import(
      "../../../../payment/application/webhook/stock-rollback.service"
    );

    const result = await WebhookStockRollbackService.rollbackOrderStock(orderId);

    if (!result.success) {
      throw new Error(`Stock rollback failed: ${result.errors.join(", ")}`);
    }
  }

  /**
   * Rollback Redis reservations using order items data (database transaction failed)
   * Used when transaction fails before order is persisted to database
   */
  static async rollbackOrderItemsFromData(
    orderItemsData: OrderItemData[],
    userId: string
  ): Promise<void> {
    await StockRedisOperationsService.rollbackReservationsFromData(orderItemsData, userId);
  }
}