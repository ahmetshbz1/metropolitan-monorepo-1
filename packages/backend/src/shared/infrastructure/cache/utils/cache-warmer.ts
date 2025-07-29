//  "cache-warmer.ts"
//  metropolitan backend
//  Distributed cache warming utility

import { ApiCacheService } from "../api-cache.service";
import { expandKeyPattern } from "./key-pattern-expander";

export interface CacheWarmingPattern {
  keyPattern: string;
  fetchFn: (key: string) => Promise<any>;
  ttl?: number;
  priority?: number;
}

export class CacheWarmer {
  private static readonly CONCURRENCY_LIMIT = 10;
  
  /**
   * Warm cache with specified patterns
   */
  static async warmCache(patterns: CacheWarmingPattern[]): Promise<void> {
    // Sort by priority (higher priority first)
    const sorted = patterns.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    console.log("🔥 Starting cache warm-up...");
    
    for (const pattern of sorted) {
      try {
        await this.warmPattern(pattern);
      } catch (error) {
        console.error(`Failed to warm cache for pattern ${pattern.keyPattern}:`, error);
      }
    }
    
    console.log("🎯 Cache warm-up completed");
  }
  
  private static async warmPattern(pattern: CacheWarmingPattern): Promise<void> {
    const keys = await expandKeyPattern(pattern.keyPattern);
    
    // Warm cache in parallel with concurrency limit
    for (let i = 0; i < keys.length; i += this.CONCURRENCY_LIMIT) {
      const batch = keys.slice(i, i + this.CONCURRENCY_LIMIT);
      
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
  }
}