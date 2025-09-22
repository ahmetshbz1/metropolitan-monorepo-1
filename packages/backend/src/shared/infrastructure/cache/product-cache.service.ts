// product-cache.service.ts
// Orchestrator service for all product caching operations
// Delegates to specialized cache services for better modularity

import type { Product } from "@metropolitan/shared";

import { CacheManagementService } from "./cache-management.service";
import { CategoryCacheService } from "./category-cache.service";
import { IndividualProductCacheService } from "./individual-product-cache.service";
import { SpecialProductCacheService } from "./special-product-cache.service";

export class ProductCacheService {
  private static individualCache = new IndividualProductCacheService();
  private static categoryCache = new CategoryCacheService();
  private static specialCache = new SpecialProductCacheService();

  // Individual product operations
  static async getCachedProduct(productId: string): Promise<Product | null> {
    return this.individualCache.getCachedProduct(productId);
  }

  static async cacheProduct(product: Product): Promise<void> {
    return this.individualCache.cacheProduct(product);
  }

  static async cacheProducts(products: Product[]): Promise<void> {
    return this.individualCache.cacheProducts(products);
  }

  static async invalidateProduct(productId: string): Promise<void> {
    return this.individualCache.invalidateProduct(productId);
  }

  // Category operations
  static async getCachedCategoryProducts(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Product[] | null> {
    return this.categoryCache.getCachedCategoryProducts(categoryId, page, limit);
  }

  static async cacheCategoryProducts(
    categoryId: string,
    products: Product[],
    page: number = 1,
    limit: number = 20
  ): Promise<void> {
    return this.categoryCache.cacheCategoryProducts(categoryId, products, page, limit);
  }

  // Special collections operations
  static async getCachedFeaturedProducts(): Promise<Product[] | null> {
    return this.specialCache.getCachedFeaturedProducts();
  }

  static async cacheFeaturedProducts(products: Product[]): Promise<void> {
    return this.specialCache.cacheFeaturedProducts(products);
  }

  static async getCachedBestsellers(): Promise<Product[] | null> {
    return this.specialCache.getCachedBestsellers();
  }

  static async cacheBestsellers(products: Product[]): Promise<void> {
    return this.specialCache.cacheBestsellers(products);
  }

  static async getCachedWeeklyProducts(): Promise<Product[] | null> {
    return this.specialCache.getCachedWeeklyProducts();
  }

  static async cacheWeeklyProducts(products: Product[]): Promise<void> {
    return this.specialCache.cacheWeeklyProducts(products);
  }

  static async getCachedNewArrivals(): Promise<Product[] | null> {
    return this.specialCache.getCachedNewArrivals();
  }

  static async cacheNewArrivals(products: Product[]): Promise<void> {
    return this.specialCache.cacheNewArrivals(products);
  }

  // Bulk operations
  static async invalidateCategoryCaches(): Promise<void> {
    await Promise.all([
      this.categoryCache.invalidateAllCategories(),
      this.specialCache.invalidateAllSpecialCollections(),
    ]);
    console.log('Category caches invalidated');
  }

  static async warmupCache(products: Product[]): Promise<void> {
    return this.individualCache.warmupCache(products);
  }

  // Management operations
  static async getCacheStats(): Promise<{
    totalCachedProducts: number;
    memoryUsage: string;
  }> {
    return CacheManagementService.getCacheStats();
  }
}