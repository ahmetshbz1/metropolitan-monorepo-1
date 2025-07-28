//  "product-cache.service.ts"
//  Product caching service for performance optimization
//  Implements Redis-based caching for frequently accessed products

import type { Product } from "@metropolitan/shared";
import { redis } from "../database/redis";

export class ProductCacheService {
  private static CACHE_TTL = 3600; // 1 hour cache duration
  private static CACHE_PREFIX = "product:";
  private static CATEGORY_CACHE_PREFIX = "category_products:";
  private static FEATURED_CACHE_KEY = "featured_products";
  private static BESTSELLERS_CACHE_KEY = "bestsellers";
  private static WEEKLY_CACHE_KEY = "weekly_products";
  private static NEW_ARRIVALS_CACHE_KEY = "new_arrivals";

  /**
   * Get cached product by ID
   */
  static async getCachedProduct(productId: string): Promise<Product | null> {
    try {
      const cached = await redis.get(`${this.CACHE_PREFIX}${productId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Error fetching cached product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Cache a single product
   */
  static async cacheProduct(product: Product): Promise<void> {
    try {
      await redis.setex(
        `${this.CACHE_PREFIX}${product.id}`,
        this.CACHE_TTL,
        JSON.stringify(product)
      );
    } catch (error) {
      console.error(`Error caching product ${product.id}:`, error);
    }
  }

  /**
   * Cache multiple products in a pipeline
   */
  static async cacheProducts(products: Product[]): Promise<void> {
    if (products.length === 0) return;

    try {
      const pipeline = redis.pipeline();
      
      products.forEach(product => {
        pipeline.setex(
          `${this.CACHE_PREFIX}${product.id}`,
          this.CACHE_TTL,
          JSON.stringify(product)
        );
      });

      await pipeline.exec();
    } catch (error) {
      console.error('Error caching multiple products:', error);
    }
  }

  /**
   * Invalidate cached product
   */
  static async invalidateProduct(productId: string): Promise<void> {
    try {
      await redis.del(`${this.CACHE_PREFIX}${productId}`);
    } catch (error) {
      console.error(`Error invalidating product cache ${productId}:`, error);
    }
  }

  /**
   * Get cached products by category
   */
  static async getCachedCategoryProducts(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Product[] | null> {
    try {
      const cacheKey = `${this.CATEGORY_CACHE_PREFIX}${categoryId}:${page}:${limit}`;
      const cached = await redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Error fetching cached category products:`, error);
      return null;
    }
  }

  /**
   * Cache products by category
   */
  static async cacheCategoryProducts(
    categoryId: string,
    products: Product[],
    page: number = 1,
    limit: number = 20
  ): Promise<void> {
    try {
      const cacheKey = `${this.CATEGORY_CACHE_PREFIX}${categoryId}:${page}:${limit}`;
      await redis.setex(
        cacheKey,
        this.CACHE_TTL / 2, // 30 minutes for category lists
        JSON.stringify(products)
      );
    } catch (error) {
      console.error('Error caching category products:', error);
    }
  }

  /**
   * Get cached featured products
   */
  static async getCachedFeaturedProducts(): Promise<Product[] | null> {
    try {
      const cached = await redis.get(this.FEATURED_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error fetching cached featured products:', error);
      return null;
    }
  }

  /**
   * Cache featured products
   */
  static async cacheFeaturedProducts(products: Product[]): Promise<void> {
    try {
      await redis.setex(
        this.FEATURED_CACHE_KEY,
        this.CACHE_TTL / 2, // 30 minutes
        JSON.stringify(products)
      );
    } catch (error) {
      console.error('Error caching featured products:', error);
    }
  }

  /**
   * Get cached bestsellers
   */
  static async getCachedBestsellers(): Promise<Product[] | null> {
    try {
      const cached = await redis.get(this.BESTSELLERS_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error fetching cached bestsellers:', error);
      return null;
    }
  }

  /**
   * Cache bestsellers
   */
  static async cacheBestsellers(products: Product[]): Promise<void> {
    try {
      await redis.setex(
        this.BESTSELLERS_CACHE_KEY,
        this.CACHE_TTL / 2, // 30 minutes
        JSON.stringify(products)
      );
    } catch (error) {
      console.error('Error caching bestsellers:', error);
    }
  }

  /**
   * Get cached weekly products
   */
  static async getCachedWeeklyProducts(): Promise<Product[] | null> {
    try {
      const cached = await redis.get(this.WEEKLY_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error fetching cached weekly products:', error);
      return null;
    }
  }

  /**
   * Cache weekly products
   */
  static async cacheWeeklyProducts(products: Product[]): Promise<void> {
    try {
      await redis.setex(
        this.WEEKLY_CACHE_KEY,
        this.CACHE_TTL / 2, // 30 minutes
        JSON.stringify(products)
      );
    } catch (error) {
      console.error('Error caching weekly products:', error);
    }
  }

  /**
   * Get cached new arrivals
   */
  static async getCachedNewArrivals(): Promise<Product[] | null> {
    try {
      const cached = await redis.get(this.NEW_ARRIVALS_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error fetching cached new arrivals:', error);
      return null;
    }
  }

  /**
   * Cache new arrivals
   */
  static async cacheNewArrivals(products: Product[]): Promise<void> {
    try {
      await redis.setex(
        this.NEW_ARRIVALS_CACHE_KEY,
        this.CACHE_TTL / 2, // 30 minutes
        JSON.stringify(products)
      );
    } catch (error) {
      console.error('Error caching new arrivals:', error);
    }
  }

  /**
   * Invalidate all category caches (after product update)
   */
  static async invalidateCategoryCaches(): Promise<void> {
    try {
      const stream = redis.scanStream({
        match: `${this.CATEGORY_CACHE_PREFIX}*`,
        count: 100,
      });

      const pipeline = redis.pipeline();
      
      stream.on('data', (keys: string[]) => {
        keys.forEach(key => pipeline.del(key));
      });

      stream.on('end', async () => {
        // Also invalidate special product lists
        pipeline.del(this.FEATURED_CACHE_KEY);
        pipeline.del(this.BESTSELLERS_CACHE_KEY);
        pipeline.del(this.WEEKLY_CACHE_KEY);
        pipeline.del(this.NEW_ARRIVALS_CACHE_KEY);
        
        await pipeline.exec();
        console.log('Category caches invalidated');
      });
    } catch (error) {
      console.error('Error invalidating category caches:', error);
    }
  }

  /**
   * Warm up cache with frequently accessed products
   */
  static async warmupCache(products: Product[]): Promise<void> {
    if (products.length === 0) return;

    try {
      console.log(`Warming up cache with ${products.length} products`);
      await this.cacheProducts(products);
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }

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
      let totalCachedProducts = 0;
      const stream = redis.scanStream({
        match: `${this.CACHE_PREFIX}*`,
        count: 100,
      });

      return new Promise((resolve) => {
        stream.on('data', (keys: string[]) => {
          totalCachedProducts += keys.length;
        });

        stream.on('end', () => {
          resolve({
            totalCachedProducts,
            memoryUsage,
          });
        });
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalCachedProducts: 0,
        memoryUsage: 'unknown',
      };
    }
  }
}