//  "cache-aside-strategy.ts"
//  metropolitan backend
//  Cache-aside pattern with automatic refresh

import { redis } from "../../database/redis";
import { ApiCacheService } from "../api-cache.service";
import { BaseCacheStrategy, type CacheOptions } from "./base-cache-strategy";

export class CacheAsideStrategy<T> extends BaseCacheStrategy<T> {
  async execute(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const { ttl, staleWhileRevalidate, staleTtl } = this.mergeOptions(options);
    
    // Try to get from cache
    const cached = await ApiCacheService.get<T>(key);
    
    if (cached) {
      // Check if stale-while-revalidate is enabled
      if (staleWhileRevalidate) {
        const cacheAge = await this.getCacheAge(key);
        
        if (cacheAge > ttl && cacheAge < staleTtl) {
          // Return stale data and refresh in background
          this.refreshInBackground(key, fetchFn, staleTtl);
        }
      }
      
      return cached;
    }
    
    // Cache miss - fetch and cache
    const data = await fetchFn();
    await ApiCacheService.set(key, data, { ttl: staleTtl });
    
    return data;
  }
  
  private async getCacheAge(key: string): Promise<number> {
    const ttl = await redis.ttl(key);
    const maxAge = await redis.get(`${key}:maxage`);
    
    if (!maxAge || ttl < 0) return Infinity;
    
    return parseInt(maxAge) - ttl;
  }
  
  private refreshInBackground(
    key: string,
    fetchFn: () => Promise<T>,
    staleTtl: number
  ): void {
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