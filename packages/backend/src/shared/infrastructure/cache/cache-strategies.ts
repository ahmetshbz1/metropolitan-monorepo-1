//  "cache-strategies.ts"
//  metropolitan backend
//  Advanced caching strategies for different data types

import { redis } from "../database/redis";
import { ApiCacheService } from "./api-cache.service";

export class CacheStrategies {
  /**
   * Cache-aside pattern with automatic refresh
   */
  static async cacheAside<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      ttl?: number;
      staleWhileRevalidate?: boolean;
      staleTtl?: number;
    } = {}
  ): Promise<T> {
    const { ttl = 300, staleWhileRevalidate = true, staleTtl = 3600 } = options;
    
    // Try to get from cache
    const cached = await ApiCacheService.get<T>(key);
    
    if (cached) {
      // Check if stale-while-revalidate is enabled
      if (staleWhileRevalidate) {
        const cacheAge = await this.getCacheAge(key);
        
        if (cacheAge > ttl && cacheAge < staleTtl) {
          // Return stale data and refresh in background
          setImmediate(async () => {
            try {
              const fresh = await fetchFn();
              await ApiCacheService.set(key, fresh, { ttl: staleTtl });
            } catch (error) {
              console.error(`Failed to refresh cache for ${key}:`, error);
            }
          });
        }
      }
      
      return cached;
    }
    
    // Cache miss - fetch and cache
    const data = await fetchFn();
    await ApiCacheService.set(key, data, { ttl: staleTtl });
    
    return data;
  }
  
  /**
   * Write-through cache pattern
   */
  static async writeThrough<T>(
    key: string,
    data: T,
    persistFn: (data: T) => Promise<void>,
    ttl: number = 300
  ): Promise<void> {
    // Write to database first
    await persistFn(data);
    
    // Then update cache
    await ApiCacheService.set(key, data, { ttl });
  }
  
  /**
   * Write-behind (write-back) cache pattern
   */
  static createWriteBehind<T>(
    flushInterval: number = 5000, // 5 seconds
    maxBatchSize: number = 100
  ) {
    const writeQueue = new Map<string, { data: T; timestamp: number }>();
    let flushTimer: Timer | null = null;
    
    const flush = async (persistFn: (batch: Map<string, T>) => Promise<void>) => {
      if (writeQueue.size === 0) return;
      
      const batch = new Map<string, T>();
      writeQueue.forEach((item, key) => {
        batch.set(key, item.data);
      });
      
      writeQueue.clear();
      
      try {
        await persistFn(batch);
      } catch (error) {
        console.error("Write-behind flush failed:", error);
        // Re-add items to queue on failure
        batch.forEach((data, key) => {
          writeQueue.set(key, { data, timestamp: Date.now() });
        });
      }
    };
    
    const scheduleFlush = (persistFn: (batch: Map<string, T>) => Promise<void>) => {
      if (flushTimer) clearTimeout(flushTimer);
      
      flushTimer = setTimeout(() => flush(persistFn), flushInterval);
    };
    
    return {
      write: async (
        key: string,
        data: T,
        persistFn: (batch: Map<string, T>) => Promise<void>
      ) => {
        // Update cache immediately
        await ApiCacheService.set(key, data);
        
        // Add to write queue
        writeQueue.set(key, { data, timestamp: Date.now() });
        
        // Flush if batch size reached
        if (writeQueue.size >= maxBatchSize) {
          await flush(persistFn);
        } else {
          scheduleFlush(persistFn);
        }
      },
      
      flush: async (persistFn: (batch: Map<string, T>) => Promise<void>) => {
        if (flushTimer) clearTimeout(flushTimer);
        await flush(persistFn);
      },
    };
  }
  
  /**
   * Distributed cache warming
   */
  static async warmCache(
    patterns: Array<{
      keyPattern: string;
      fetchFn: (key: string) => Promise<any>;
      ttl?: number;
      priority?: number;
    }>
  ): Promise<void> {
    // Sort by priority (higher priority first)
    const sorted = patterns.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    console.log("🔥 Starting cache warm-up...");
    
    for (const pattern of sorted) {
      try {
        const keys = await this.expandKeyPattern(pattern.keyPattern);
        
        // Warm cache in parallel with concurrency limit
        const concurrencyLimit = 10;
        for (let i = 0; i < keys.length; i += concurrencyLimit) {
          const batch = keys.slice(i, i + concurrencyLimit);
          
          await Promise.all(
            batch.map(async (key) => {
              try {
                const data = await pattern.fetchFn(key);
                await ApiCacheService.set(key, data, { ttl: pattern.ttl });
              } catch (error) {
                console.error(`Failed to warm cache for ${key}:`, error);
              }
            })
          );
        }
        
        console.log(`✅ Warmed ${keys.length} keys for pattern: ${pattern.keyPattern}`);
      } catch (error) {
        console.error(`Failed to warm cache for pattern ${pattern.keyPattern}:`, error);
      }
    }
    
    console.log("🎯 Cache warm-up completed");
  }
  
  /**
   * Get cache age in seconds
   */
  private static async getCacheAge(key: string): Promise<number> {
    const ttl = await redis.ttl(key);
    const maxAge = await redis.get(`${key}:maxage`);
    
    if (!maxAge || ttl < 0) return Infinity;
    
    return parseInt(maxAge) - ttl;
  }
  
  /**
   * Expand key pattern to actual keys
   */
  private static async expandKeyPattern(pattern: string): Promise<string[]> {
    // Handle specific patterns
    if (pattern.includes("{userId}")) {
      // Get active user IDs from database
      const { db } = await import("../database/connection");
      const { users } = await import("../database/schema");
      const { sql } = await import("drizzle-orm");
      
      const activeUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`${users.is_active} = true`)
        .limit(100); // Limit for performance
      
      return activeUsers.map(user => pattern.replace("{userId}", user.id));
    }
    
    if (pattern.includes("{productId}")) {
      // Get popular product IDs
      const { db } = await import("../database/connection");
      const { products, orderItems } = await import("../database/schema");
      const { sql, desc } = await import("drizzle-orm");
      
      const popularProducts = await db
        .select({ id: products.id })
        .from(products)
        .leftJoin(orderItems, sql`${orderItems.product_id} = ${products.id}`)
        .groupBy(products.id)
        .orderBy(desc(sql`COUNT(${orderItems.id})`))
        .limit(50); // Top 50 products
      
      return popularProducts.map(product => pattern.replace("{productId}", product.id));
    }
    
    // Return pattern as-is if no expansion needed
    return [pattern];
  }
  
  /**
   * Cache performance metrics
   */
  static async getMetrics(): Promise<{
    hitRate: number;
    missRate: number;
    avgResponseTime: number;
    cacheSize: number;
    evictionRate: number;
  }> {
    const stats = await redis.info("stats");
    const memory = await redis.info("memory");
    
    // Parse Redis stats
    const keyspaceHits = parseInt(stats.match(/keyspace_hits:(\d+)/)?.[1] || "0");
    const keyspaceMisses = parseInt(stats.match(/keyspace_misses:(\d+)/)?.[1] || "0");
    const totalCalls = keyspaceHits + keyspaceMisses;
    
    const evictedKeys = parseInt(stats.match(/evicted_keys:(\d+)/)?.[1] || "0");
    const usedMemory = parseInt(memory.match(/used_memory:(\d+)/)?.[1] || "0");
    
    return {
      hitRate: totalCalls > 0 ? (keyspaceHits / totalCalls) * 100 : 0,
      missRate: totalCalls > 0 ? (keyspaceMisses / totalCalls) * 100 : 0,
      avgResponseTime: 0.5, // Redis typically responds in < 1ms
      cacheSize: usedMemory,
      evictionRate: evictedKeys,
    };
  }
}