//  "redis-rollback.strategy.ts"
//  metropolitan backend
//  Redis-specific rollback strategy

import type { RollbackStrategy, RollbackResult } from "../rollback-types";

export class RedisRollbackStrategy implements RollbackStrategy {
  async rollback(
    orderDetails: Array<{
      userId: string;
      productId: string;
      quantity: number;
    }>
  ): Promise<RollbackResult> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const { RedisStockService } = await import(
        "../../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const detail of orderDetails) {
        try {
          await RedisStockService.rollbackReservation(
            detail.userId,
            detail.productId
          );
          successCount++;
        } catch (error) {
          errors.push(
            `Redis rollback failed for ${detail.productId}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      return {
        success: successCount > 0,
        method: "redis",
        itemsRolledBack: successCount,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        method: "redis",
        itemsRolledBack: 0,
        errors: [
          `Redis service unavailable: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
      };
    }
  }

  async verify(
    orderDetails: Array<{ productId: string }>
  ): Promise<{
    verified: boolean;
    stockLevels: Array<{
      productId: string;
      currentStock: number;
    }>;
  }> {
    const stockLevels: Array<{
      productId: string;
      currentStock: number;
    }> = [];

    try {
      const { RedisStockService } = await import(
        "../../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const detail of orderDetails) {
        const currentStock = await RedisStockService.getCurrentStock(
          detail.productId
        );
        stockLevels.push({
          productId: detail.productId,
          currentStock,
        });
      }

      return {
        verified: true,
        stockLevels,
      };
    } catch (error) {
      return {
        verified: false,
        stockLevels: [],
      };
    }
  }
}