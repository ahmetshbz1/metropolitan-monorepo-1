// individual-product-cache.service.ts
// Handles caching for individual products
// Extends base cache service for common functionality

import type { Product } from "@metropolitan/shared";

import { redis } from "../database/redis";
import { logger } from "../monitoring/logger.config";

import { BaseCacheService } from "./base-cache.service";

export class IndividualProductCacheService extends BaseCacheService<Product> {
  protected CACHE_PREFIX = "product:";
  protected CACHE_TTL = 3600; // 1 hour

  /**
   * Get cached product by ID
   */
  async getCachedProduct(productId: string): Promise<Product | null> {
    return this.getCached(productId);
  }

  /**
   * Cache a single product
   */
  async cacheProduct(product: Product): Promise<void> {
    await this.cache(product.id, product);
  }

  /**
   * Cache multiple products in a pipeline
   */
  async cacheProducts(products: Product[]): Promise<void> {
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Error caching multiple products");
    }
  }

  /**
   * Invalidate cached product
   */
  async invalidateProduct(productId: string): Promise<void> {
    await this.invalidate(productId);
  }

  /**
   * Warm up cache with frequently accessed products
   */
  async warmupCache(products: Product[]): Promise<void> {
    if (products.length === 0) return;

    try {
      logger.info({ count: products.length }, "Warming up cache with products");
      await this.cacheProducts(products);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Error warming up cache");
    }
  }
}