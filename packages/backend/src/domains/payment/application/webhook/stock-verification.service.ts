//  "stock-verification.service.ts"
//  metropolitan backend
//  Stock verification operations separated from rollback service

import { WebhookOrderManagementService } from "./order-management.service";
import { RedisRollbackStrategy } from "./rollback-strategies/redis-rollback.strategy";
import type { StockVerificationResult } from "./rollback-types";

export class StockVerificationService {
  /**
   * Verify stock rollback was successful
   */
  static async verifyStockRollback(
    orderId: string
  ): Promise<StockVerificationResult> {
    try {
      // Get order details
      const orderDetailsResult = await WebhookOrderManagementService
        .getOrderDetailsForRollback(orderId);

      if (!orderDetailsResult.success) {
        return {
          verified: false,
          currentStockLevels: [],
          message: "Unable to verify rollback: order details not found",
        };
      }

      // Use Redis strategy to verify current stock levels
      const redisStrategy = new RedisRollbackStrategy();
      const verificationResult = await redisStrategy.verify(
        orderDetailsResult.orderDetails
      );

      const stockLevels = verificationResult.stockLevels.map((level) => ({
        productId: level.productId,
        currentStock: level.currentStock,
        reservations: 0, // Would need additional implementation
      }));

      return {
        verified: verificationResult.verified,
        currentStockLevels: stockLevels,
        message: `Stock rollback verification completed for order ${orderId}`,
      };
    } catch (error) {
      return {
        verified: false,
        currentStockLevels: [],
        message: `Stock rollback verification failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Emergency stock reset for specific products
   */
  static async emergencyStockReset(
    resetRequests: Record<string, number>
  ): Promise<{
    success: boolean;
    resetProducts: string[];
    errors: string[];
  }> {
    const resetProducts: string[] = [];
    const errors: string[] = [];

    try {
      const { RedisStockService } = await import(
        "../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const [productId, stockLevel] of Object.entries(resetRequests)) {
        try {
          await RedisStockService.setStockLevel(productId, stockLevel);
          resetProducts.push(productId);
          console.log(
            `🔄 Emergency stock reset: ${productId} = ${stockLevel}`
          );
        } catch (error) {
          errors.push(
            `Failed to reset ${productId}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
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
        errors: [
          `Emergency reset failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
      };
    }
  }
}