//  "distributed-locking.service.ts"
//  metropolitan backend
//  Distributed locking service extracted from RedisStockService

import { redis } from "../../database/redis";
import { logger } from "../../monitoring/logger.config";

// Redis key prefixes for locking
const LOCK_CONFIG = {
  TIMEOUT_MS: 5000, // 5 seconds
  KEY_PREFIX: "stock_lock:",
} as const;

export class DistributedLockingService {
  private static readonly LOCK_TIMEOUT = LOCK_CONFIG.TIMEOUT_MS;
  private static readonly LOCK_PREFIX = LOCK_CONFIG.KEY_PREFIX;

  /**
   * Acquire distributed lock for stock operations
   * Prevents race conditions across multiple server instances
   */
  static async acquireLock(
    productId: string,
    userId: string
  ): Promise<{ success: boolean; lockKey: string; error?: string }> {
    const lockKey = `${this.LOCK_PREFIX}${productId}`;

    try {
      // Try to acquire lock with expiration (NX = only if not exists, PX = expire in milliseconds)
      const lockAcquired = await redis.set(
        lockKey,
        userId,
        "PX",
        this.LOCK_TIMEOUT,
        "NX"
      );

      if (!lockAcquired) {
        return {
          success: false,
          lockKey,
          error: "Another user is currently processing this product. Please try again.",
        };
      }

      logger.debug({ userId, productId }, "Lock acquired for product");
      return {
        success: true,
        lockKey,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ productId, error: errorMessage }, "Failed to acquire lock");
      return {
        success: false,
        lockKey,
        error: "Lock acquisition failed due to system error",
      };
    }
  }

  /**
   * Release distributed lock
   * Should always be called in finally block
   */
  static async releaseLock(lockKey: string, productId: string): Promise<void> {
    try {
      const result = await redis.del(lockKey);
      if (result > 0) {
        logger.debug({ productId }, "Lock released for product");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ lockKey, error: errorMessage }, "Failed to release lock");
      // Don't throw - this is cleanup code
    }
  }

  /**
   * Check if a product is currently locked
   */
  static async isLocked(productId: string): Promise<boolean> {
    const lockKey = `${this.LOCK_PREFIX}${productId}`;
    
    try {
      const exists = await redis.exists(lockKey);
      return exists === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ productId, error: errorMessage }, "Failed to check lock status");
      return false; // Assume not locked on error
    }
  }

  /**
   * Get lock owner (for debugging)
   */
  static async getLockOwner(productId: string): Promise<string | null> {
    const lockKey = `${this.LOCK_PREFIX}${productId}`;
    
    try {
      const owner = await redis.get(lockKey);
      return owner;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ productId, error: errorMessage }, "Failed to get lock owner");
      return null;
    }
  }

  /**
   * Force release lock (admin function - use with caution)
   */
  static async forceReleaseLock(productId: string): Promise<boolean> {
    const lockKey = `${this.LOCK_PREFIX}${productId}`;
    
    try {
      const result = await redis.del(lockKey);
      if (result > 0) {
        logger.warn({ productId }, "Force released lock for product - admin action");
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ productId, error: errorMessage }, "Failed to force release lock");
      return false;
    }
  }
}