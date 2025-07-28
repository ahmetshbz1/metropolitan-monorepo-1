//  "redis-stock.service.ts"
//  metropolitan backend  
//  Main orchestrator for Redis-based stock management
//  Refactored: Now delegates to focused modular services for better maintainability

// Import focused modular services
import { StockReservationService } from "./stock/stock-reservation.service";
import { StockSyncService } from "./stock/stock-sync.service";
import { StockMonitoringService } from "./stock/stock-monitoring.service";
import { StockMaintenanceService } from "./stock/stock-maintenance.service";
import { REDIS_STOCK_SCRIPTS } from "./stock/stock-maintenance.service";

// Re-export types for backward compatibility
export type { ReservationResult, StockReservation, StockActivity } from "./stock/stock-config";

/**
 * Main Redis Stock Service - Now acts as orchestrator for modular services
 * Maintains backward compatibility while providing better code organization
 */
export class RedisStockService {
  // === RESERVATION OPERATIONS (delegated to StockReservationService) ===
  
  /**
   * Atomic stock reservation with distributed locking
   * Prevents race conditions across multiple server instances
   */
  static async reserveStockAtomic(
    productId: string,
    userId: string,
    quantity: number
  ) {
    return StockReservationService.reserveStockAtomic(productId, userId, quantity);
  }

  /**
   * Rollback stock reservation (payment failed)
   */
  static async rollbackReservation(
    userId: string,
    productId: string
  ): Promise<void> {
    return StockReservationService.rollbackReservation(userId, productId);
  }

  /**
   * Confirm stock reservation (payment successful)
   */
  static async confirmReservation(
    userId: string,
    productId: string
  ): Promise<void> {
    return StockReservationService.confirmReservation(userId, productId);
  }

  // === SYNCHRONIZATION OPERATIONS (delegated to StockSyncService) ===

  /**
   * Sync stock from database to Redis (initialization)
   */
  static async syncStockFromDB(
    productId: string,
    stockAmount: number
  ): Promise<void> {
    return StockSyncService.syncStockFromDB(productId, stockAmount);
  }

  /**
   * Get current stock from Redis (fast read)
   */
  static async getCurrentStock(productId: string): Promise<number> {
    return StockSyncService.getCurrentStock(productId);
  }

  /**
   * Bulk stock check for multiple products
   */
  static async checkMultipleProductsStock(
    productIds: string[]
  ): Promise<Record<string, number>> {
    return StockSyncService.checkMultipleProductsStock(productIds);
  }

  // === MONITORING OPERATIONS (delegated to StockMonitoringService) ===

  /**
   * Monitor real-time stock changes (for admin dashboard)
   */
  static async getStockActivity(productId: string) {
    return StockMonitoringService.getStockActivity(productId);
  }

  /**
   * Get all stock activities across all products
   */
  static async getAllStockActivities(limit?: number) {
    return StockMonitoringService.getAllStockActivities(limit);
  }

  /**
   * Get stock activity statistics for analytics
   */
  static async getStockStats() {
    return StockMonitoringService.getStockStats();
  }

  // === MAINTENANCE OPERATIONS (delegated to StockMaintenanceService) ===

  /**
   * Clean up expired reservations (cleanup job)
   */
  static async cleanupExpiredReservations(): Promise<number> {
    return StockMaintenanceService.cleanupExpiredReservations();
  }

  /**
   * Health check for Redis stock system
   */
  static async healthCheck() {
    return StockMaintenanceService.healthCheck();
  }

  // === EXTENDED OPERATIONS (new capabilities from modular services) ===

  /**
   * Bulk sync multiple products from database to Redis
   */
  static async bulkSyncFromDB(
    productStocks: Array<{ productId: string; stock: number }>
  ): Promise<void> {
    return StockSyncService.bulkSyncFromDB(productStocks);
  }

  /**
   * Get all stock levels from Redis (admin use)
   */
  static async getAllStockLevels(): Promise<Record<string, number>> {
    return StockSyncService.getAllStockLevels();
  }

  /**
   * Set stock level directly in Redis (admin use)
   */
  static async setStockLevel(
    productId: string,
    stockLevel: number
  ): Promise<void> {
    return StockSyncService.setStockLevel(productId, stockLevel);
  }

  /**
   * Get active reservations (not yet confirmed or rolled back)
   */
  static async getActiveReservations() {
    return StockMonitoringService.getActiveReservations();
  }

  /**
   * Clean up all reservations for specific product (admin use)
   */
  static async cleanupProductReservations(productId: string): Promise<number> {
    return StockMaintenanceService.cleanupProductReservations(productId);
  }
}

// Re-export Lua scripts for backward compatibility
export { REDIS_STOCK_SCRIPTS };

// Usage example:
/*
// Order creation with Redis (same API as before)
const reservation = await RedisStockService.reserveStockAtomic(
  productId,
  userId,
  quantity
);

if (reservation.success) {
  // Create order and process payment

  // On payment success:
  await RedisStockService.confirmReservation(userId, productId);

  // On payment failure:
  await RedisStockService.rollbackReservation(userId, productId);
}

// New capabilities from modular refactoring:
const stats = await RedisStockService.getStockStats();
const health = await RedisStockService.healthCheck();
const activeReservations = await RedisStockService.getActiveReservations();
*/