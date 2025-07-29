//  "stock-rollback.service.ts"
//  metropolitan backend  
//  Orchestrates stock rollback operations using strategy pattern
//  Refactored to use modular rollback strategies

import { WebhookOrderManagementService } from "./order-management.service";
import { RedisRollbackStrategy } from "./rollback-strategies/redis-rollback.strategy";
import { DatabaseRollbackStrategy } from "./rollback-strategies/database-rollback.strategy";
import { StockVerificationService } from "./stock-verification.service";
import type { RollbackResult } from "./rollback-types";

export class WebhookStockRollbackService {

  /**
   * Comprehensive stock rollback for failed/canceled payments
   * Uses both Redis and database for consistency
   */
  static async rollbackOrderStock(orderId: string): Promise<{
    success: boolean;
    redisRollback: boolean;
    databaseRollback: boolean;
    errors: string[];
    message: string;
  }> {
    console.log(`🔄 Starting stock rollback for order ${orderId}`);

    // Get order details for rollback
    const orderDetailsResult = await WebhookOrderManagementService
      .getOrderDetailsForRollback(orderId);

    if (!orderDetailsResult.success || orderDetailsResult.orderDetails.length === 0) {
      return {
        success: false,
        redisRollback: false,
        databaseRollback: false,
        errors: [`Unable to get order details: ${orderDetailsResult.error || 'No items found'}`],
        message: `Stock rollback failed for order ${orderId}`,
      };
    }

    // Execute rollback strategies
    const redisStrategy = new RedisRollbackStrategy();
    const databaseStrategy = new DatabaseRollbackStrategy();

    const [redisResult, databaseResult] = await Promise.allSettled([
      redisStrategy.rollback(orderDetailsResult.orderDetails),
      databaseStrategy.rollback(orderDetailsResult.orderDetails, orderId),
    ]);

    // Process results
    const redisRollback = redisResult.status === "fulfilled" && redisResult.value.success;
    const databaseRollback = databaseResult.status === "fulfilled" && databaseResult.value.success;
    
    const errors: string[] = [];
    
    if (redisResult.status === "rejected") {
      errors.push(`Redis rollback failed: ${redisResult.reason}`);
    } else if (!redisResult.value.success) {
      errors.push(...redisResult.value.errors);
    }
    
    if (databaseResult.status === "rejected") {
      errors.push(`Database rollback failed: ${databaseResult.reason}`);
    } else if (!databaseResult.value.success) {
      errors.push(...databaseResult.value.errors);
    }

    const success = redisRollback || databaseRollback;

    return {
      success,
      redisRollback,
      databaseRollback,
      errors,
      message: success
        ? `Stock rollback completed for order ${orderId} (Redis: ${redisRollback}, DB: ${databaseRollback})`
        : `Stock rollback failed for order ${orderId}`,
    };
  }

  /**
   * Rollback specific product stock for a user
   */
  static async rollbackProductStock(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<{
    success: boolean;
    method: 'redis' | 'database' | 'both' | 'none';
    message: string;
  }> {
    const redisStrategy = new RedisRollbackStrategy();
    const result = await redisStrategy.rollback([{ userId, productId, quantity }]);

    return {
      success: result.success,
      method: result.success ? result.method : 'none',
      message: result.success
        ? `Stock rollback successful for product ${productId} (${result.method})`
        : `Stock rollback failed for product ${productId}`,
    };
  }

  /**
   * Verify stock rollback was successful
   * @deprecated Use StockVerificationService.verifyStockRollback() instead
   */
  static async verifyStockRollback(orderId: string) {
    return StockVerificationService.verifyStockRollback(orderId);
  }

  /**
   * Emergency stock reset for specific order (admin use)
   * @deprecated Use StockVerificationService.emergencyStockReset() instead
   */
  static async emergencyStockReset(
    orderId: string,
    resetToStock: Record<string, number>
  ) {
    // orderId parameter is kept for backward compatibility but not used
    return StockVerificationService.emergencyStockReset(resetToStock);
  }
}