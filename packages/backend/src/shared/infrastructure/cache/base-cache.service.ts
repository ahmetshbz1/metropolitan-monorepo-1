// base-cache.service.ts
// Base class for Redis caching operations
// Provides common functionality for all cache services

import { redis } from "../database/redis";

export abstract class BaseCacheService<T> {
  protected abstract CACHE_PREFIX: string;
  protected CACHE_TTL: number = 3600; // Default 1 hour

  /**
   * Get cached item by key
   */
  protected async getCached(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(`${this.CACHE_PREFIX}${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Error fetching cached item ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache an item
   */
  protected async cache(key: string, data: T, ttl?: number): Promise<void> {
    try {
      await redis.setex(
        `${this.CACHE_PREFIX}${key}`,
        ttl || this.CACHE_TTL,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(`Error caching item ${key}:`, error);
    }
  }

  /**
   * Invalidate cached item
   */
  protected async invalidate(key: string): Promise<void> {
    try {
      await redis.del(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error(`Error invalidating cache ${key}:`, error);
    }
  }

  /**
   * Invalidate all items matching pattern
   */
  protected async invalidatePattern(pattern: string): Promise<void> {
    try {
      const stream = redis.scanStream({
        match: `${this.CACHE_PREFIX}${pattern}`,
        count: 100,
      });

      const pipeline = redis.pipeline();
      
      stream.on('data', (keys: string[]) => {
        keys.forEach(key => pipeline.del(key));
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('end', async () => {
          try {
            await pipeline.exec();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Error invalidating pattern:', error);
    }
  }
}