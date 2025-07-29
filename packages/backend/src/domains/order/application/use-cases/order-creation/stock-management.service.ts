//  "stock-management.service.ts"
//  metropolitan backend
//  Orchestrates stock validation and reservation using specialized services

import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";
import { StockValidationService } from "./stock-validation.service";
import { StockRedisOperationsService } from "./stock-redis-operations.service";
import { StockDatabaseSyncService } from "./stock-database-sync.service";

export class StockManagementService {
  /**
   * CRITICAL: Stock validation and reservation with Redis
   * Prevents race conditions and over-selling using distributed locking
   */
  static async validateAndReserveStock(
    tx: any,
    orderItemsData: OrderItemData[]
  ): Promise<void> {
    try {
      // Try Redis-based reservation first (faster + distributed locking)
      const { reservations, allSuccessful } = await StockRedisOperationsService
        .reserveStockInRedis(orderItemsData);

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
      await StockDatabaseSyncService.reserveStockInDatabase(tx, orderItemsData);
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
}