//  "redis-stock-operations.service.ts"
//  metropolitan backend
//  Redis operations, monitoring and cleanup extracted from RedisStockService

import { redis } from "../../database/redis";

// Redis key prefixes and configuration
const OPERATIONS_CONFIG = {
  KEY_PREFIXES: {
    STOCK: "stock:",
    RESERVATION: "reservation:",
  },
  CLEANUP: {
    BATCH_SIZE: 100,
    MAX_AGE_HOURS: 24,
  },
} as const;

export class RedisStockOperationsService {
  private static readonly STOCK_PREFIX = OPERATIONS_CONFIG.KEY_PREFIXES.STOCK;
  private static readonly RESERVATION_PREFIX = OPERATIONS_CONFIG.KEY_PREFIXES.RESERVATION;

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
    const stockKeys = productIds.map((id) => `${this.STOCK_PREFIX}${id}`);
    const stocks = await redis.mget(...stockKeys);

    const result: Record<string, number> = {};
    productIds.forEach((productId, index) => {
      result[productId] = stocks[index] ? parseInt(stocks[index]!) : 0;
    });

    return result;
  }

  /**
   * Monitor real-time stock changes (for admin dashboard)
   * Uses SCAN for production safety
   */
  static async getStockActivity(productId: string): Promise<any[]> {
    const pattern = `${this.RESERVATION_PREFIX}*:${productId}`;
    const activities: any[] = [];
    
    return new Promise((resolve, reject) => {
      const stream = redis.scanStream({
        match: pattern,
        count: OPERATIONS_CONFIG.CLEANUP.BATCH_SIZE,
      });
      
      stream.on('data', async (keys: string[]) => {
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.get(key));
        
        const results = await pipeline.exec();
        if (results) {
          results.forEach(([err, data]) => {
            if (!err && data) {
              try {
                activities.push(JSON.parse(data as string));
              } catch (parseError) {
                console.warn(`Failed to parse reservation data:`, parseError);
              }
            }
          });
        }
      });
      
      stream.on('end', () => {
        const sorted = activities.sort(
          (a, b) =>
            new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime()
        );
        resolve(sorted);
      });
      
      stream.on('error', (err) => {
        console.error('Error fetching stock activity:', err);
        reject(err);
      });
    });
  }

  /**
   * Get all stock levels (for admin monitoring)
   */
  static async getAllStockLevels(): Promise<Record<string, number>> {
    const pattern = `${this.STOCK_PREFIX}*`;
    const stockLevels: Record<string, number> = {};
    
    return new Promise((resolve, reject) => {
      const stream = redis.scanStream({
        match: pattern,
        count: OPERATIONS_CONFIG.CLEANUP.BATCH_SIZE,
      });
      
      stream.on('data', async (keys: string[]) => {
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.get(key));
        
        const results = await pipeline.exec();
        if (results) {
          keys.forEach((key, index) => {
            const [err, data] = results[index];
            if (!err && data) {
              const productId = key.replace(this.STOCK_PREFIX, '');
              stockLevels[productId] = parseInt(data as string);
            }
          });
        }
      });
      
      stream.on('end', () => {
        resolve(stockLevels);
      });
      
      stream.on('error', (err) => {
        console.error('Error fetching stock levels:', err);
        reject(err);
      });
    });
  }

  /**
   * Clean up expired reservations (cleanup job)
   * Uses SCAN instead of KEYS for production safety
   */
  static async cleanupExpiredReservations(): Promise<number> {
    const pattern = `${this.RESERVATION_PREFIX}*`;
    const stream = redis.scanStream({
      match: pattern,
      count: OPERATIONS_CONFIG.CLEANUP.BATCH_SIZE,
    });
    
    let cleanedCount = 0;
    const now = new Date();
    const pipeline = redis.pipeline();
    
    return new Promise((resolve, reject) => {
      stream.on('data', async (keys: string[]) => {
        for (const key of keys) {
          try {
            const data = await redis.get(key);
            if (data) {
              const reservation = JSON.parse(data);
              const reservedAt = new Date(reservation.reservedAt);
              const hoursSinceReservation =
                (now.getTime() - reservedAt.getTime()) / (1000 * 60 * 60);

              // Clean up reservations older than configured max age
              if (hoursSinceReservation > OPERATIONS_CONFIG.CLEANUP.MAX_AGE_HOURS) {
                pipeline.del(key);
                cleanedCount++;
              }
            }
          } catch (error) {
            console.warn(`Failed to process reservation key ${key}:`, error);
          }
        }
      });
      
      stream.on('end', async () => {
        if (cleanedCount > 0) {
          await pipeline.exec();
        }
        console.log(`🧹 Cleaned up ${cleanedCount} expired reservations`);
        resolve(cleanedCount);
      });
      
      stream.on('error', (err) => {
        console.error('Error during reservation cleanup:', err);
        reject(err);
      });
    });
  }

  /**
   * Health check for Redis stock system
   */
  static async healthCheck(): Promise<{
    redis: boolean;
    operations: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let redisHealthy = true;
    let operationsHealthy = true;

    try {
      // Test basic Redis connectivity
      await redis.ping();
    } catch (error) {
      redisHealthy = false;
      errors.push(`Redis ping failed: ${error.message}`);
    }

    try {
      // Test stock operations
      const testKey = `${this.STOCK_PREFIX}health_check_test`;
      await redis.set(testKey, "100");
      const value = await redis.get(testKey);
      await redis.del(testKey);
      
      if (value !== "100") {
        operationsHealthy = false;
        errors.push("Stock operations test failed");
      }
    } catch (error) {
      operationsHealthy = false;
      errors.push(`Stock operations test failed: ${error.message}`);
    }

    return {
      redis: redisHealthy,
      operations: operationsHealthy,
      errors,
    };
  }

  /**
   * Get Redis memory usage for stock data
   */
  static async getMemoryUsage(): Promise<{
    stockKeys: number;
    reservationKeys: number;
    estimatedMemory: string;
  }> {
    let stockKeyCount = 0;
    let reservationKeyCount = 0;

    // Count stock keys
    const stockStream = redis.scanStream({
      match: `${this.STOCK_PREFIX}*`,
      count: OPERATIONS_CONFIG.CLEANUP.BATCH_SIZE,
    });

    await new Promise<void>((resolve) => {
      stockStream.on('data', (keys: string[]) => {
        stockKeyCount += keys.length;
      });
      stockStream.on('end', resolve);
    });

    // Count reservation keys
    const reservationStream = redis.scanStream({
      match: `${this.RESERVATION_PREFIX}*`,
      count: OPERATIONS_CONFIG.CLEANUP.BATCH_SIZE,
    });

    await new Promise<void>((resolve) => {
      reservationStream.on('data', (keys: string[]) => {
        reservationKeyCount += keys.length;
      });
      reservationStream.on('end', resolve);
    });

    // Rough memory estimation (key + value size)
    const estimatedBytes = (stockKeyCount * 50) + (reservationKeyCount * 200);
    const estimatedMemory = estimatedBytes > 1024 * 1024 
      ? `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(estimatedBytes / 1024).toFixed(2)} KB`;

    return {
      stockKeys: stockKeyCount,
      reservationKeys: reservationKeyCount,
      estimatedMemory,
    };
  }
}