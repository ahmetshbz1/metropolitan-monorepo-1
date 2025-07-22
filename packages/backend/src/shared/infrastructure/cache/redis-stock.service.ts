//  "redis-stock.service.ts"
//  Redis-based stock management for race condition prevention
//  High-performance distributed locking and stock tracking

import { redis } from "../database/redis";

export class RedisStockService {
  private static LOCK_TIMEOUT = 5000; // 5 seconds
  private static STOCK_PREFIX = "stock:";
  private static LOCK_PREFIX = "stock_lock:";
  private static RESERVATION_PREFIX = "reservation:";

  /**
   * Atomic stock reservation with distributed locking
   * Prevents race conditions across multiple server instances
   */
  static async reserveStockAtomic(
    productId: string,
    userId: string,
    quantity: number
  ): Promise<{ success: boolean; remainingStock?: number; error?: string }> {
    const lockKey = `${this.LOCK_PREFIX}${productId}`;
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const reservationKey = `${this.RESERVATION_PREFIX}${userId}:${productId}`;

    // 1. Acquire distributed lock
    const lockAcquired = await redis.set(
      lockKey,
      userId,
      "PX",
      this.LOCK_TIMEOUT,
      "NX"
    );

    if (!lockAcquired) {
      return {
        success: false,
        error:
          "Another user is currently processing this product. Please try again.",
      };
    }

    try {
      // 2. Get current stock from Redis, if not exists load from database
      const currentStock = await redis.get(stockKey);
      let availableStock = currentStock ? parseInt(currentStock) : null;
      
      // If stock not in Redis, load from database
      if (availableStock === null) {
        console.log(`🔍 Stock not found in Redis for ${productId}, loading from database...`);
        
        try {
          const { db } = await import("../database/connection");
          const { products } = await import("../database/schema");
          const { eq } = await import("drizzle-orm");
          
          const product = await db.query.products.findFirst({
            where: eq(products.id, productId),
            columns: { stock: true }
          });
          
          if (product) {
            availableStock = product.stock || 0;
            // Set stock in Redis for future use
            await redis.set(stockKey, availableStock.toString());
            console.log(`📊 Stock loaded from database: ${productId} = ${availableStock}`);
          } else {
            console.log(`❌ Product not found in database: ${productId}`);
            availableStock = 0;
          }
        } catch (dbError) {
          console.error(`❌ Database error loading stock for ${productId}:`, dbError);
          availableStock = 0;
        }
      }

      console.log(`🔒 Lock acquired by ${userId} for product ${productId}`);
      console.log(
        `📦 Current stock: ${availableStock}, Requested: ${quantity}`
      );

      // 3. Check if sufficient stock available
      if (availableStock < quantity) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
        };
      }

      // 4. Reserve stock atomically
      const newStock = await redis.decrby(stockKey, quantity);

      // 5. Store reservation info (for rollback)
      await redis.setex(
        reservationKey,
        3600,
        JSON.stringify({
          productId,
          userId,
          quantity,
          reservedAt: new Date().toISOString(),
          status: "reserved",
        })
      );

      console.log(
        `✅ Stock reserved: ${quantity} items, Remaining: ${newStock}`
      );

      return {
        success: true,
        remainingStock: newStock,
      };
    } finally {
      // 6. Always release the lock
      await redis.del(lockKey);
      console.log(`🔓 Lock released for product ${productId}`);
    }
  }

  /**
   * Rollback stock reservation (payment failed)
   */
  static async rollbackReservation(
    userId: string,
    productId: string
  ): Promise<void> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const reservationKey = `${this.RESERVATION_PREFIX}${userId}:${productId}`;

    try {
      // Get reservation details
      const reservationData = await redis.get(reservationKey);
      if (!reservationData) {
        console.warn(`No reservation found for ${userId}:${productId}`);
        return;
      }

      const reservation = JSON.parse(reservationData);

      // Return stock to Redis
      const newStock = await redis.incrby(stockKey, reservation.quantity);

      // Mark reservation as rolled back
      await redis.setex(
        reservationKey,
        3600,
        JSON.stringify({
          ...reservation,
          status: "rolled_back",
          rolledBackAt: new Date().toISOString(),
        })
      );

      console.log(
        `🔄 Stock rolled back: +${reservation.quantity} items, New stock: ${newStock}`
      );
    } catch (error) {
      console.error(
        `Failed to rollback reservation for ${userId}:${productId}`,
        error
      );
    }
  }

  /**
   * Confirm stock reservation (payment successful)
   */
  static async confirmReservation(
    userId: string,
    productId: string
  ): Promise<void> {
    const reservationKey = `${this.RESERVATION_PREFIX}${userId}:${productId}`;

    try {
      const reservationData = await redis.get(reservationKey);
      if (!reservationData) {
        console.warn(`No reservation found for ${userId}:${productId}`);
        return;
      }

      const reservation = JSON.parse(reservationData);

      // Mark reservation as confirmed
      await redis.setex(
        reservationKey,
        86400,
        JSON.stringify({
          // Keep for 24h for audit
          ...reservation,
          status: "confirmed",
          confirmedAt: new Date().toISOString(),
        })
      );

      console.log(`✅ Reservation confirmed for ${userId}:${productId}`);
    } catch (error) {
      console.error(
        `Failed to confirm reservation for ${userId}:${productId}`,
        error
      );
    }
  }

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
   */
  static async getStockActivity(productId: string): Promise<any[]> {
    const pattern = `${this.RESERVATION_PREFIX}*:${productId}`;
    const keys = await redis.keys(pattern);

    const activities = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        activities.push(JSON.parse(data));
      }
    }

    return activities.sort(
      (a, b) =>
        new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime()
    );
  }

  /**
   * Clean up expired reservations (cleanup job)
   */
  static async cleanupExpiredReservations(): Promise<number> {
    const pattern = `${this.RESERVATION_PREFIX}*`;
    const keys = await redis.keys(pattern);

    let cleanedCount = 0;
    const now = new Date();

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const reservation = JSON.parse(data);
        const reservedAt = new Date(reservation.reservedAt);
        const hoursSinceReservation =
          (now.getTime() - reservedAt.getTime()) / (1000 * 60 * 60);

        // Clean up reservations older than 24 hours
        if (hoursSinceReservation > 24) {
          await redis.del(key);
          cleanedCount++;
        }
      }
    }

    console.log(`🧹 Cleaned up ${cleanedCount} expired reservations`);
    return cleanedCount;
  }
}

/**
 * Redis Lua Script for atomic stock operations
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
};

// Usage example:
/*
// Order creation with Redis
const reservation = await RedisStockService.reserveStockAtomic(
  productId,
  userId,
  quantity
);

if (reservation.success) {
  // Create order and process payment

  // On payment success:
  await RedisStockService.confirmReservation(userId, productId);

  // On payment failure:
  await RedisStockService.rollbackReservation(userId, productId);
}
*/
