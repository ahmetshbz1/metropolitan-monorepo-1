//  "api-cache.service.ts"
//  metropolitan backend
//  API response caching for performance optimization

import { redis } from "../database/redis";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
  tags?: string[]; // Cache tags for invalidation
}

export class ApiCacheService {
  private static CACHE_PREFIX = "api_cache:";
  private static DEFAULT_TTL = 300; // 5 minutes default

  /**
   * Generate cache key from request parameters
   */
  static generateCacheKey(
    endpoint: string,
    params?: Record<string, unknown>,
    userId?: string
  ): string {
    const baseKey = `${this.CACHE_PREFIX}${endpoint}`;
    const paramKey = params ? `:${JSON.stringify(params)}` : "";
    const userKey = userId ? `:user:${userId}` : "";
    
    return `${baseKey}${userKey}${paramKey}`;
  }

  /**
   * Get cached response
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      
      // Check if cache is still valid
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        await redis.del(key);
        return null;
      }
      
      return data.value as T;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set cache with options
   */
  static async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const ttl = options.ttl || this.DEFAULT_TTL;
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      const cacheData = {
        value,
        expiresAt: expiresAt.toISOString(),
        tags: options.tags || [],
        cachedAt: new Date().toISOString(),
      };
      
      await redis.setex(key, ttl, JSON.stringify(cacheData));
      
      // Store tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, key);
          await redis.expire(`tag:${tag}`, ttl);
        }
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Invalidate cache by key pattern
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(`${this.CACHE_PREFIX}${pattern}`);
      if (keys.length === 0) return 0;
      
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error("Cache invalidation error:", error);
      return 0;
    }
  }

  /**
   * Invalidate cache by tag
   */
  static async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await redis.smembers(`tag:${tag}`);
      if (keys.length === 0) return 0;
      
      await redis.del(...keys);
      await redis.del(`tag:${tag}`);
      
      return keys.length;
    } catch (error) {
      console.error("Cache tag invalidation error:", error);
      return 0;
    }
  }

  /**
   * Warm up cache for critical endpoints
   */
  static async warmupCache(
    fetchFunctions: Array<{
      key: string;
      fetch: () => Promise<unknown>;
      options?: CacheOptions;
    }>
  ): Promise<void> {
    console.log("🔥 Warming up cache...");
    
    const promises = fetchFunctions.map(async ({ key, fetch, options }) => {
      try {
        const data = await fetch();
        await this.set(key, data, options);
        console.log(`✅ Cached: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to warm cache for ${key}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log("🎯 Cache warmup completed");
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    try {
      const info = await redis.info("memory");
      const keys = await redis.keys(`${this.CACHE_PREFIX}*`);
      
      // Parse memory usage from Redis info
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : "Unknown";
      
      return {
        totalKeys: keys.length,
        memoryUsage,
      };
    } catch (error) {
      console.error("Failed to get cache stats:", error);
      return {
        totalKeys: 0,
        memoryUsage: "Unknown",
      };
    }
  }
}

// Cache middleware for Elysia
interface CacheMiddlewareSet {
  headers: Record<string, string>;
}

interface CacheMiddlewareContext {
  request: Request;
  set: CacheMiddlewareSet;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  user?: { id?: string };
  response?: unknown;
  error?: unknown;
  afterHandle?: (response: unknown) => unknown | Promise<unknown>;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  return async function (context: CacheMiddlewareContext) {
    const { request, set, params, query, user } = context;

    const mergedParams = { ...(params ?? {}), ...(query ?? {}) };
    const cacheKey = ApiCacheService.generateCacheKey(
      request.url,
      mergedParams,
      user?.id
    );

    const cached = await ApiCacheService.get<unknown>(cacheKey);
    if (cached !== null) {
      set.headers["X-Cache"] = "HIT";
      return cached;
    }

    set.headers["X-Cache"] = "MISS";

    const originalAfterHandle = context.afterHandle;

    context.afterHandle = async (response: unknown) => {
      if (response !== undefined && !context.error) {
        await ApiCacheService.set(cacheKey, response, options);
      }

      if (originalAfterHandle) {
        return originalAfterHandle(response);
      }

      return response;
    };
  };
}