// special-product-cache.service.ts
// Handles caching for special product collections
// Featured, bestsellers, weekly, and new arrivals

import type { Product } from "@metropolitan/shared";
import { BaseCacheService } from "./base-cache.service";

export class SpecialProductCacheService extends BaseCacheService<Product[]> {
  protected CACHE_PREFIX = "";
  protected CACHE_TTL = 1800; // 30 minutes

  // Cache keys for special collections
  private readonly FEATURED_KEY = "featured_products";
  private readonly BESTSELLERS_KEY = "bestsellers";
  private readonly WEEKLY_KEY = "weekly_products";
  private readonly NEW_ARRIVALS_KEY = "new_arrivals";

  /**
   * Get cached featured products
   */
  async getCachedFeaturedProducts(): Promise<Product[] | null> {
    return this.getCached(this.FEATURED_KEY);
  }

  /**
   * Cache featured products
   */
  async cacheFeaturedProducts(products: Product[]): Promise<void> {
    await this.cache(this.FEATURED_KEY, products);
  }

  /**
   * Get cached bestsellers
   */
  async getCachedBestsellers(): Promise<Product[] | null> {
    return this.getCached(this.BESTSELLERS_KEY);
  }

  /**
   * Cache bestsellers
   */
  async cacheBestsellers(products: Product[]): Promise<void> {
    await this.cache(this.BESTSELLERS_KEY, products);
  }

  /**
   * Get cached weekly products
   */
  async getCachedWeeklyProducts(): Promise<Product[] | null> {
    return this.getCached(this.WEEKLY_KEY);
  }

  /**
   * Cache weekly products
   */
  async cacheWeeklyProducts(products: Product[]): Promise<void> {
    await this.cache(this.WEEKLY_KEY, products);
  }

  /**
   * Get cached new arrivals
   */
  async getCachedNewArrivals(): Promise<Product[] | null> {
    return this.getCached(this.NEW_ARRIVALS_KEY);
  }

  /**
   * Cache new arrivals
   */
  async cacheNewArrivals(products: Product[]): Promise<void> {
    await this.cache(this.NEW_ARRIVALS_KEY, products);
  }

  /**
   * Invalidate all special collections
   */
  async invalidateAllSpecialCollections(): Promise<void> {
    await Promise.all([
      this.invalidate(this.FEATURED_KEY),
      this.invalidate(this.BESTSELLERS_KEY),
      this.invalidate(this.WEEKLY_KEY),
      this.invalidate(this.NEW_ARRIVALS_KEY),
    ]);
  }
}