//  "stock-maintenance.service.ts"
//  metropolitan backend  
//  Orchestrator for stock maintenance and cleanup operations

import { ReservationCleaner } from "./cleaners/reservation-cleaner";
import { ProductReservationCleaner } from "./cleaners/product-reservation-cleaner";
import { StockHealthChecker } from "./stock-health-checker";
import { StockResetService } from "./stock-reset.service";
import type { StockHealthStatus } from "./stock-health-checker";

/**
 * Facade for all stock maintenance operations
 * Delegates to specialized services for each operation type
 */
export class StockMaintenanceService {
  /**
   * Clean up expired reservations (cleanup job)
   * Uses SCAN instead of KEYS for production safety
   */
  static async cleanupExpiredReservations(): Promise<number> {
    return ReservationCleaner.cleanupExpired();
  }

  /**
   * Clean up all reservations for specific product (admin use)
   */
  static async cleanupProductReservations(productId: string): Promise<number> {
    return ProductReservationCleaner.cleanupByProduct(productId);
  }

  /**
   * Clean up all reservations for specific user (admin use)
   */
  static async cleanupUserReservations(userId: string): Promise<number> {
    return ProductReservationCleaner.cleanupByUser(userId);
  }

  /**
   * Reset all stock data in Redis (emergency use)
   */
  static async resetAllStockData(): Promise<void> {
    return StockResetService.resetAllStockData();
  }

  /**
   * Health check for Redis stock system
   */
  static async healthCheck(): Promise<StockHealthStatus> {
    return StockHealthChecker.check();
  }
}

// Re-export Lua scripts from separate file
export { REDIS_STOCK_SCRIPTS } from "./redis-stock-scripts";