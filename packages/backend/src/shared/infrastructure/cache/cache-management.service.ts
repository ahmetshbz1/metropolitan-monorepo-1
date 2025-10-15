// cache-management.service.ts
// Manages cache statistics and maintenance operations
// Provides monitoring and management capabilities

import { redis } from "../database/redis";
import { logger } from "../monitoring/logger.config";

export class CacheManagementService {
  private static readonly PRODUCT_PREFIX = "product:";

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalCachedProducts: number;
    memoryUsage: string;
  }> {
    try {
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      // Count cached products
      const totalCachedProducts = await this.countCachedItems(this.PRODUCT_PREFIX);

      return {
        totalCachedProducts,
        memoryUsage,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Error getting cache stats");
      return {
        totalCachedProducts: 0,
        memoryUsage: 'unknown',
      };
    }
  }

  /**
   * Count cached items by prefix
   */
  private static async countCachedItems(prefix: string): Promise<number> {
    let count = 0;
    const stream = redis.scanStream({
      match: `${prefix}*`,
      count: 100,
    });

    return new Promise((resolve) => {
      stream.on('data', (keys: string[]) => {
        count += keys.length;
      });

      stream.on('end', () => {
        resolve(count);
      });

      stream.on('error', () => {
        resolve(0);
      });
    });
  }

  /**
   * Clear all caches
   */
  static async clearAllCaches(): Promise<void> {
    try {
      await redis.flushdb();
      logger.warn("All caches cleared - admin action");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Error clearing caches");
    }
  }
}