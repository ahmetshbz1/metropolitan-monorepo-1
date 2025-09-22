//  "cache-strategies.ts"
//  metropolitan backend
//  Advanced caching strategies orchestrator

import type { CacheOptions } from "./strategies/base-cache-strategy";
import { CacheAsideStrategy } from "./strategies/cache-aside-strategy";
import { WriteBehindStrategy } from "./strategies/write-behind-strategy";
import { WriteThroughStrategy } from "./strategies/write-through-strategy";
import { CacheMetricsCollector } from "./utils/cache-metrics";
import { CacheWarmer } from "./utils/cache-warmer";
import type { CacheWarmingPattern } from "./utils/cache-warmer";

/**
 * Facade for all caching strategies
 * Maintains backward compatibility while using refactored modules
 */
export class CacheStrategies {
  private static cacheAsideStrategy = new CacheAsideStrategy();
  
  /**
   * Cache-aside pattern with automatic refresh
   */
  static async cacheAside<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    return this.cacheAsideStrategy.execute(key, fetchFn, options);
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
    return WriteThroughStrategy.execute(key, data, persistFn, ttl);
  }
  
  /**
   * Write-behind (write-back) cache pattern
   */
  static createWriteBehind<T>(
    flushInterval: number = 5000,
    maxBatchSize: number = 100
  ) {
    const strategy = new WriteBehindStrategy<T>({
      flushInterval,
      maxBatchSize,
    });
    
    return {
      write: (key: string, data: T, persistFn: (batch: Map<string, T>) => Promise<void>) =>
        strategy.write(key, data, persistFn),
      flush: (persistFn: (batch: Map<string, T>) => Promise<void>) =>
        strategy.flush(persistFn),
    };
  }
  
  /**
   * Distributed cache warming
   */
  static async warmCache(patterns: CacheWarmingPattern[]): Promise<void> {
    return CacheWarmer.warmCache(patterns);
  }
  
  /**
   * Cache performance metrics
   */
  static async getMetrics() {
    return CacheMetricsCollector.getMetrics();
  }
}