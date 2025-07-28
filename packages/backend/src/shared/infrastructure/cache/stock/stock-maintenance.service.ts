//  "stock-maintenance.service.ts"
//  metropolitan backend  
//  Focused service for stock maintenance and cleanup operations
//  Extracted from redis-stock.service.ts (lines 301-394)

import { redis } from "../../database/redis";
import { REDIS_STOCK_CONFIG, type StockReservation } from "./stock-config";

export class StockMaintenanceService {
  private static readonly RESERVATION_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.RESERVATION;

  /**
   * Clean up expired reservations (cleanup job)
   * Uses SCAN instead of KEYS for production safety
   */
  static async cleanupExpiredReservations(): Promise<number> {
    const pattern = `${this.RESERVATION_PREFIX}*`;
    const stream = redis.scanStream({
      match: pattern,
      count: 100, // Process 100 keys at a time
    });
    
    let cleanedCount = 0;
    const now = new Date();
    const pipeline = redis.pipeline();
    
    return new Promise((resolve, reject) => {
      stream.on('data', async (keys: string[]) => {
        for (const key of keys) {
          const data = await redis.get(key);
          if (data) {
            try {
              const reservation: StockReservation = JSON.parse(data);
              const reservedAt = new Date(reservation.reservedAt);
              const hoursSinceReservation =
                (now.getTime() - reservedAt.getTime()) / (1000 * 60 * 60);

              // Clean up reservations older than 24 hours
              if (hoursSinceReservation > 24) {
                pipeline.del(key);
                cleanedCount++;
              }
            } catch (parseError) {
              console.warn(`Failed to parse reservation data for cleanup: ${key}`, parseError);
              // Delete invalid data
              pipeline.del(key);
              cleanedCount++;
            }
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
   * Clean up all reservations for specific product (admin use)
   */
  static async cleanupProductReservations(productId: string): Promise<number> {
    const pattern = `${this.RESERVATION_PREFIX}*:${productId}`;
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    console.log(`🧹 Cleaned up ${keys.length} reservations for product ${productId}`);
    return keys.length;
  }

  /**
   * Clean up all reservations for specific user (admin use)
   */
  static async cleanupUserReservations(userId: string): Promise<number> {
    const pattern = `${this.RESERVATION_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    console.log(`🧹 Cleaned up ${keys.length} reservations for user ${userId}`);
    return keys.length;
  }

  /**
   * Reset all stock data in Redis (emergency use)
   */
  static async resetAllStockData(): Promise<void> {
    const stockPattern = `${REDIS_STOCK_CONFIG.KEY_PREFIXES.STOCK}*`;
    const lockPattern = `${REDIS_STOCK_CONFIG.KEY_PREFIXES.LOCK}*`;
    const reservationPattern = `${this.RESERVATION_PREFIX}*`;
    
    const [stockKeys, lockKeys, reservationKeys] = await Promise.all([
      redis.keys(stockPattern),
      redis.keys(lockPattern),
      redis.keys(reservationPattern),
    ]);

    const allKeys = [...stockKeys, ...lockKeys, ...reservationKeys];
    
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }

    console.log(`🧹 Reset all stock data: ${allKeys.length} keys deleted`);
  }

  /**
   * Health check for Redis stock system
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    stockKeysCount: number;
    reservationKeysCount: number;
    lockKeysCount: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      const [stockKeys, reservationKeys, lockKeys] = await Promise.all([
        redis.keys(`${REDIS_STOCK_CONFIG.KEY_PREFIXES.STOCK}*`),
        redis.keys(`${this.RESERVATION_PREFIX}*`),
        redis.keys(`${REDIS_STOCK_CONFIG.KEY_PREFIXES.LOCK}*`),
      ]);

      // Check for stuck locks (should be temporary)
      if (lockKeys.length > 0) {
        issues.push(`${lockKeys.length} active locks found (may indicate stuck operations)`);
      }

      // Check for old reservations
      const now = new Date();
      let oldReservations = 0;
      
      for (const key of reservationKeys) {
        const data = await redis.get(key);
        if (data) {
          try {
            const reservation: StockReservation = JSON.parse(data);
            const reservedAt = new Date(reservation.reservedAt);
            const hoursSinceReservation = (now.getTime() - reservedAt.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceReservation > 2) { // More than 2 hours old
              oldReservations++;
            }
          } catch {
            issues.push(`Invalid reservation data found: ${key}`);
          }
        }
      }

      if (oldReservations > 0) {
        issues.push(`${oldReservations} old reservations found (consider cleanup)`);
      }

      const status = lockKeys.length > 10 || oldReservations > 100 ? 'warning' : 
                    issues.length > 0 ? 'warning' : 'healthy';

      return {
        status,
        stockKeysCount: stockKeys.length,
        reservationKeysCount: reservationKeys.length,
        lockKeysCount: lockKeys.length,
        issues,
      };
    } catch (error) {
      return {
        status: 'error',
        stockKeysCount: 0,
        reservationKeysCount: 0,
        lockKeysCount: 0,
        issues: [`Health check failed: ${error}`],
      };
    }
  }
}

/**
 * Redis Lua Scripts for atomic stock operations
 * Ensures true atomicity even under high concurrency
 */
export const REDIS_STOCK_SCRIPTS = {
  // Atomic reserve with availability check
  atomicReserve: `
    local stockKey = KEYS[1]
    local quantity = tonumber(ARGV[1])
    local currentStock = tonumber(redis.call('GET', stockKey) or 0)

    if currentStock >= quantity then
      local newStock = redis.call('DECRBY', stockKey, quantity)
      return {1, newStock}
    else
      return {0, currentStock}
    end
  `,

  // Atomic rollback
  atomicRollback: `
    local stockKey = KEYS[1]
    local quantity = tonumber(ARGV[1])
    local newStock = redis.call('INCRBY', stockKey, quantity)
    return newStock
  `,

  // Atomic multi-product reserve
  atomicMultiReserve: `
    local products = {}
    local totalKeys = #KEYS
    
    -- Check all products first
    for i = 1, totalKeys do
      local stockKey = KEYS[i]
      local quantity = tonumber(ARGV[i])
      local currentStock = tonumber(redis.call('GET', stockKey) or 0)
      
      if currentStock < quantity then
        return {0, i, currentStock, quantity} -- failure: key index, current, requested
      end
      
      products[i] = {stockKey, quantity, currentStock}
    end
    
    -- If all checks pass, reserve all products
    local results = {}
    for i = 1, totalKeys do
      local stockKey = products[i][1]
      local quantity = products[i][2]
      local newStock = redis.call('DECRBY', stockKey, quantity)
      results[i] = newStock
    end
    
    return {1, results} -- success with new stock levels
  `,
};