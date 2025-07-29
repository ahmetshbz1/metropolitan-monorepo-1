// cache-management.service.ts
// Manages cache statistics and maintenance operations
// Provides monitoring and management capabilities

import { redis } from "../database/redis";

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
      console.error('Error getting cache stats:', error);
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
      console.log('All caches cleared');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }
}