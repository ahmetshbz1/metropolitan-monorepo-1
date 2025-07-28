//  "distributed-locking.service.ts"
//  metropolitan backend
//  Distributed locking service extracted from RedisStockService

import { redis } from "../../database/redis";

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

      console.log(`🔒 Lock acquired by ${userId} for product ${productId}`);
      return {
        success: true,
        lockKey,
      };
    } catch (error) {
      console.error(`Failed to acquire lock for ${productId}:`, error);
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
        console.log(`🔓 Lock released for product ${productId}`);
      }
    } catch (error) {
      console.error(`Failed to release lock ${lockKey}:`, error);
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
      console.error(`Failed to check lock status for ${productId}:`, error);
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
      console.error(`Failed to get lock owner for ${productId}:`, error);
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
        console.log(`⚠️ Force released lock for product ${productId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to force release lock for ${productId}:`, error);
      return false;
    }
  }
}