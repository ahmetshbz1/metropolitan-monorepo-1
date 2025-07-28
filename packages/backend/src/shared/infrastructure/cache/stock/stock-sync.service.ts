//  "stock-sync.service.ts"
//  metropolitan backend  
//  Focused service for stock synchronization and bulk operations
//  Extracted from redis-stock.service.ts (lines 219-252)

import { redis } from "../../database/redis";
import { REDIS_STOCK_CONFIG } from "./stock-config";

export class StockSyncService {
  private static readonly STOCK_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.STOCK;

  /**
   * Sync stock from database to Redis (initialization)
   */
  static async syncStockFromDB(
    productId: string,
    stockAmount: number
  ): Promise<void> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    await redis.set(stockKey, stockAmount);
    console.log(`📊 Stock synced to Redis: ${productId} = ${stockAmount}`);
  }

  /**
   * Get current stock from Redis (fast read)
   */
  static async getCurrentStock(productId: string): Promise<number> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const stock = await redis.get(stockKey);
    return stock ? parseInt(stock) : 0;
  }

  /**
   * Bulk stock check for multiple products
   */
  static async checkMultipleProductsStock(
    productIds: string[]
  ): Promise<Record<string, number>> {
    if (productIds.length === 0) {
      return {};
    }

    const stockKeys = productIds.map((id) => `${this.STOCK_PREFIX}${id}`);
    const stocks = await redis.mget(...stockKeys);

    const result: Record<string, number> = {};
    productIds.forEach((productId, index) => {
      result[productId] = stocks[index] ? parseInt(stocks[index]!) : 0;
    });

    return result;
  }

  /**
   * Bulk sync multiple products from database to Redis
   */
  static async bulkSyncFromDB(
    productStocks: Array<{ productId: string; stock: number }>
  ): Promise<void> {
    if (productStocks.length === 0) {
      return;
    }

    const pipeline = redis.pipeline();
    
    productStocks.forEach(({ productId, stock }) => {
      const stockKey = `${this.STOCK_PREFIX}${productId}`;
      pipeline.set(stockKey, stock);
    });

    await pipeline.exec();
    
    console.log(`📊 Bulk synced ${productStocks.length} products to Redis`);
  }

  /**
   * Get all stock levels from Redis (admin use)
   */
  static async getAllStockLevels(): Promise<Record<string, number>> {
    const pattern = `${this.STOCK_PREFIX}*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      return {};
    }

    const stocks = await redis.mget(...keys);
    const result: Record<string, number> = {};
    
    keys.forEach((key, index) => {
      const productId = key.replace(this.STOCK_PREFIX, '');
      result[productId] = stocks[index] ? parseInt(stocks[index]!) : 0;
    });

    return result;
  }

  /**
   * Set stock level directly in Redis (admin use)
   */
  static async setStockLevel(
    productId: string,
    stockLevel: number
  ): Promise<void> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    await redis.set(stockKey, stockLevel);
    console.log(`📊 Stock level set: ${productId} = ${stockLevel}`);
  }

  /**
   * Increment stock level in Redis
   */
  static async incrementStock(
    productId: string,
    amount: number
  ): Promise<number> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const newStock = await redis.incrby(stockKey, amount);
    console.log(`📈 Stock incremented: ${productId} +${amount} = ${newStock}`);
    return newStock;
  }

  /**
   * Decrement stock level in Redis
   */
  static async decrementStock(
    productId: string,
    amount: number
  ): Promise<number> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const newStock = await redis.decrby(stockKey, amount);
    console.log(`📉 Stock decremented: ${productId} -${amount} = ${newStock}`);
    return newStock;
  }
}