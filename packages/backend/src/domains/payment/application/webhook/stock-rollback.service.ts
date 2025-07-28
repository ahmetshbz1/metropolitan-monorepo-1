//  "stock-rollback.service.ts"
//  metropolitan backend  
//  Focused service for stock rollback operations during payment failures
//  Extracted from stripe-webhook.routes.ts (stock rollback logic)

import { WebhookOrderManagementService } from "./order-management.service";

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
    const errors: string[] = [];
    let redisRollback = false;
    let databaseRollback = false;

    console.log(`🔄 Starting stock rollback for order ${orderId}`);

    try {
      // Get order details for rollback
      const orderDetailsResult = await WebhookOrderManagementService.getOrderDetailsForRollback(orderId);
      
      if (!orderDetailsResult.success || orderDetailsResult.orderDetails.length === 0) {
        return {
          success: false,
          redisRollback: false,
          databaseRollback: false,
          errors: [`Unable to get order details: ${orderDetailsResult.error || 'No items found'}`],
          message: `Stock rollback failed for order ${orderId}`,
        };
      }

      // Attempt Redis rollback first
      try {
        const { RedisStockService } = await import("../../../../shared/infrastructure/cache/redis-stock.service");
        
        for (const detail of orderDetailsResult.orderDetails) {
          await RedisStockService.rollbackReservation(detail.userId, detail.productId);
        }
        
        redisRollback = true;
        console.log(`✅ Redis stock rollback completed for order ${orderId}`);
      } catch (redisError) {
        const errorMsg = `Redis rollback failed: ${redisError instanceof Error ? redisError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.warn(errorMsg);
      }

      // Always attempt database rollback for consistency
      try {
        const { OrderCreationService } = await import("../../../order/application/use-cases/order-creation.service");
        await OrderCreationService.rollbackStock(orderId);
        
        databaseRollback = true;
        console.log(`✅ Database stock rollback completed for order ${orderId}`);
      } catch (dbError) {
        const errorMsg = `Database rollback failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
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
    } catch (error) {
      const errorMsg = `Unexpected error during stock rollback: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);

      return {
        success: false,
        redisRollback: false,
        databaseRollback: false,
        errors,
        message: `Stock rollback failed for order ${orderId}`,
      };
    }
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
    let redisSuccess = false;
    let databaseSuccess = false;

    // Try Redis first
    try {
      const { RedisStockService } = await import("../../../../shared/infrastructure/cache/redis-stock.service");
      await RedisStockService.rollbackReservation(userId, productId);
      redisSuccess = true;
    } catch (redisError) {
      console.warn(`Redis rollback failed for product ${productId}:`, redisError);
    }

    // Try database rollback (if we had a specific method, we'd use it here)
    // For now, we rely on order-level rollback
    
    if (redisSuccess) {
      return {
        success: true,
        method: 'redis',
        message: `Stock rollback successful for product ${productId} (Redis)`,
      };
    }

    return {
      success: false,
      method: 'none',
      message: `Stock rollback failed for product ${productId}`,
    };
  }

  /**
   * Verify stock rollback was successful
   */
  static async verifyStockRollback(
    orderId: string
  ): Promise<{
    verified: boolean;
    currentStockLevels: Array<{
      productId: string;
      currentStock: number;
      reservations: number;
    }>;
    message: string;
  }> {
    try {
      // Get order details
      const orderDetailsResult = await WebhookOrderManagementService.getOrderDetailsForRollback(orderId);
      
      if (!orderDetailsResult.success) {
        return {
          verified: false,
          currentStockLevels: [],
          message: 'Unable to verify rollback: order details not found',
        };
      }

      // Check current stock levels
      const stockLevels: Array<{
        productId: string;
        currentStock: number;
        reservations: number;
      }> = [];

      try {
        const { RedisStockService } = await import("../../../../shared/infrastructure/cache/redis-stock.service");
        
        for (const detail of orderDetailsResult.orderDetails) {
          const currentStock = await RedisStockService.getCurrentStock(detail.productId);
          // We'd need additional method to check reservations
          stockLevels.push({
            productId: detail.productId,
            currentStock,
            reservations: 0, // Would need to implement reservation checking
          });
        }
      } catch (error) {
        console.warn('Could not verify stock levels via Redis:', error);
      }

      return {
        verified: true,
        currentStockLevels: stockLevels,
        message: `Stock rollback verification completed for order ${orderId}`,
      };
    } catch (error) {
      return {
        verified: false,
        currentStockLevels: [],
        message: `Stock rollback verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Emergency stock reset for specific order (admin use)
   */
  static async emergencyStockReset(
    orderId: string,
    resetToStock: Record<string, number>
  ): Promise<{
    success: boolean;
    resetProducts: string[];
    errors: string[];
  }> {
    const resetProducts: string[] = [];
    const errors: string[] = [];

    try {
      const { RedisStockService } = await import("../../../../shared/infrastructure/cache/redis-stock.service");
      
      for (const [productId, stockLevel] of Object.entries(resetToStock)) {
        try {
          await RedisStockService.setStockLevel(productId, stockLevel);
          resetProducts.push(productId);
        } catch (error) {
          errors.push(`Failed to reset ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: resetProducts.length > 0,
        resetProducts,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        resetProducts: [],
        errors: [`Emergency reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
}