//  "product-reservation-cleaner.ts"
//  metropolitan backend
//  Service for cleaning product-specific reservations

import { redis } from "../../../database/redis";
import { REDIS_STOCK_CONFIG } from "../stock-config";

export class ProductReservationCleaner {
  private static readonly RESERVATION_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.RESERVATION;
  
  /**
   * Clean up all reservations for specific product (admin use)
   */
  static async cleanupByProduct(productId: string): Promise<number> {
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
  static async cleanupByUser(userId: string): Promise<number> {
    const pattern = `${this.RESERVATION_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    console.log(`🧹 Cleaned up ${keys.length} reservations for user ${userId}`);
    return keys.length;
  }
}