// category-cache.service.ts
// Handles caching for category-based product lists
// Manages category products with pagination support

import type { Product } from "@metropolitan/shared";

import { BaseCacheService } from "./base-cache.service";

export class CategoryCacheService extends BaseCacheService<Product[]> {
  protected CACHE_PREFIX = "category_products:";
  protected CACHE_TTL = 1800; // 30 minutes for lists

  /**
   * Get cached products by category
   */
  async getCachedCategoryProducts(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Product[] | null> {
    const cacheKey = `${categoryId}:${page}:${limit}`;
    return this.getCached(cacheKey);
  }

  /**
   * Cache products by category
   */
  async cacheCategoryProducts(
    categoryId: string,
    products: Product[],
    page: number = 1,
    limit: number = 20
  ): Promise<void> {
    const cacheKey = `${categoryId}:${page}:${limit}`;
    await this.cache(cacheKey, products, this.CACHE_TTL);
  }

  /**
   * Invalidate all category caches
   */
  async invalidateAllCategories(): Promise<void> {
    await this.invalidatePattern('*');
  }
}