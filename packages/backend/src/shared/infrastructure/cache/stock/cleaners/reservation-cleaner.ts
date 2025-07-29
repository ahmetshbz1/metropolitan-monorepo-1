//  "reservation-cleaner.ts"
//  metropolitan backend
//  Service for cleaning up expired stock reservations

import { redis } from "../../../database/redis";
import { REDIS_STOCK_CONFIG, type StockReservation } from "../stock-config";

export class ReservationCleaner {
  private static readonly RESERVATION_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.RESERVATION;
  private static readonly MAX_RESERVATION_AGE_HOURS = 24;
  
  /**
   * Clean up expired reservations (cleanup job)
   * Uses SCAN instead of KEYS for production safety
   */
  static async cleanupExpired(): Promise<number> {
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
          const shouldDelete = await this.shouldDeleteReservation(key, now);
          if (shouldDelete) {
            pipeline.del(key);
            cleanedCount++;
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
   * Check if a reservation should be deleted
   */
  private static async shouldDeleteReservation(key: string, now: Date): Promise<boolean> {
    const data = await redis.get(key);
    if (!data) return false;
    
    try {
      const reservation: StockReservation = JSON.parse(data);
      const reservedAt = new Date(reservation.reservedAt);
      const hoursSinceReservation = 
        (now.getTime() - reservedAt.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceReservation > this.MAX_RESERVATION_AGE_HOURS;
    } catch (parseError) {
      console.warn(`Failed to parse reservation data for cleanup: ${key}`, parseError);
      // Delete invalid data
      return true;
    }
  }
}