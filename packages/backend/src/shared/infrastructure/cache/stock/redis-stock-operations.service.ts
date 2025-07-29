//  "redis-stock-operations.service.ts"
//  metropolitan backend
//  Coordinator service that delegates to specialized stock services

import { StockSyncService } from "./stock-sync.service";
import { StockMonitoringService } from "./stock-monitoring.service";
import { StockMaintenanceService } from "./stock-maintenance.service";
import type { StockActivity } from "./stock-config";

/**
 * Redis Stock Operations Coordinator
 * Provides a unified interface for all stock-related operations
 * by delegating to specialized services
 */
export class RedisStockOperationsService {
  
  // ========== Stock Sync Operations ==========
  
  /**
   * Sync stock from database to Redis
   */
  static async syncStockFromDB(
    productId: string,
    stockAmount: number
  ): Promise<void> {
    return StockSyncService.syncStockFromDB(productId, stockAmount);
  }

  /**
   * Get current stock from Redis
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

  /**
   * Get all stock levels
   */
  static async getAllStockLevels(): Promise<Record<string, number>> {
    return StockSyncService.getAllStockLevels();
  }

  // ========== Stock Monitoring Operations ==========
  
  /**
   * Monitor real-time stock changes for specific product
   */
  static async getStockActivity(productId: string): Promise<StockActivity[]> {
    return StockMonitoringService.getStockActivity(productId);
  }

  /**
   * Get stock statistics for analytics
   */
  static async getStockStats() {
    return StockMonitoringService.getStockStats();
  }

  /**
   * Check if product has pending reservations
   */
  static async hasPendingReservations(productId: string): Promise<boolean> {
    return StockMonitoringService.hasPendingReservations(productId);
  }

  // ========== Stock Maintenance Operations ==========
  
  /**
   * Clean up expired reservations
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

  /**
   * Get Redis memory usage for stock data
   */
  static async getMemoryUsage(): Promise<{
    stockKeys: number;
    reservationKeys: number;
    estimatedMemory: string;
  }> {
    const healthCheckResult = await StockMaintenanceService.healthCheck();
    
    // Calculate estimated memory
    const stockKeySize = 50; // Average bytes per stock key
    const reservationKeySize = 200; // Average bytes per reservation key
    
    const estimatedBytes = 
      (healthCheckResult.stockKeysCount * stockKeySize) + 
      (healthCheckResult.reservationKeysCount * reservationKeySize);
    
    const estimatedMemory = estimatedBytes > 1024 * 1024 
      ? `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(estimatedBytes / 1024).toFixed(2)} KB`;

    return {
      stockKeys: healthCheckResult.stockKeysCount,
      reservationKeys: healthCheckResult.reservationKeysCount,
      estimatedMemory,
    };
  }

  // ========== Convenience Methods ==========

  /**
   * Get comprehensive stock report for a product
   */
  static async getProductStockReport(productId: string) {
    const [currentStock, activities, hasPending] = await Promise.all([
      this.getCurrentStock(productId),
      this.getStockActivity(productId),
      this.hasPendingReservations(productId),
    ]);

    return {
      productId,
      currentStock,
      hasPendingReservations: hasPending,
      recentActivities: activities.slice(0, 10),
      totalReservations: activities.length,
    };
  }

  /**
   * Get system-wide stock dashboard data
   */
  static async getDashboardData() {
    const [stockLevels, stats, health, memory] = await Promise.all([
      this.getAllStockLevels(),
      this.getStockStats(),
      this.healthCheck(),
      this.getMemoryUsage(),
    ]);

    return {
      stockLevels,
      statistics: stats,
      health,
      memory,
      timestamp: new Date().toISOString(),
    };
  }
}