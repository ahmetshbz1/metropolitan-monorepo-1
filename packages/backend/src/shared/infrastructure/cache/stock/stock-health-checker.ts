//  "stock-health-checker.ts"
//  metropolitan backend
//  Health check service for Redis stock system

import { redis } from "../../database/redis";
import { REDIS_STOCK_CONFIG, type StockReservation } from "./stock-config";

export interface StockHealthStatus {
  status: 'healthy' | 'warning' | 'error';
  stockKeysCount: number;
  reservationKeysCount: number;
  lockKeysCount: number;
  issues: string[];
}

export class StockHealthChecker {
  private static readonly RESERVATION_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.RESERVATION;
  private static readonly OLD_RESERVATION_HOURS = 2;
  private static readonly WARNING_LOCK_COUNT = 10;
  private static readonly WARNING_OLD_RESERVATION_COUNT = 100;
  
  /**
   * Perform comprehensive health check on Redis stock system
   */
  static async check(): Promise<StockHealthStatus> {
    const issues: string[] = [];
    
    try {
      const [stockKeys, reservationKeys, lockKeys] = await this.getKeyCounts();
      
      // Check for stuck locks
      if (lockKeys.length > 0) {
        issues.push(`${lockKeys.length} active locks found (may indicate stuck operations)`);
      }
      
      // Check for old reservations
      const oldReservationCount = await this.countOldReservations(reservationKeys);
      if (oldReservationCount > 0) {
        issues.push(`${oldReservationCount} old reservations found (consider cleanup)`);
      }
      
      const status = this.determineStatus(lockKeys.length, oldReservationCount, issues.length);
      
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
  
  /**
   * Get counts of different key types
   */
  private static async getKeyCounts(): Promise<[string[], string[], string[]]> {
    const [stockKeys, reservationKeys, lockKeys] = await Promise.all([
      redis.keys(`${REDIS_STOCK_CONFIG.KEY_PREFIXES.STOCK}*`),
      redis.keys(`${this.RESERVATION_PREFIX}*`),
      redis.keys(`${REDIS_STOCK_CONFIG.KEY_PREFIXES.LOCK}*`),
    ]);
    
    return [stockKeys, reservationKeys, lockKeys];
  }
  
  /**
   * Count old reservations
   */
  private static async countOldReservations(reservationKeys: string[]): Promise<number> {
    const now = new Date();
    let oldCount = 0;
    
    for (const key of reservationKeys) {
      const data = await redis.get(key);
      if (!data) continue;
      
      try {
        const reservation: StockReservation = JSON.parse(data);
        const reservedAt = new Date(reservation.reservedAt);
        const hoursSinceReservation = (now.getTime() - reservedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceReservation > this.OLD_RESERVATION_HOURS) {
          oldCount++;
        }
      } catch {
        // Count invalid data as old
        oldCount++;
      }
    }
    
    return oldCount;
  }
  
  /**
   * Determine overall health status
   */
  private static determineStatus(
    lockCount: number,
    oldReservationCount: number,
    issueCount: number
  ): 'healthy' | 'warning' | 'error' {
    if (lockCount > this.WARNING_LOCK_COUNT || 
        oldReservationCount > this.WARNING_OLD_RESERVATION_COUNT) {
      return 'warning';
    }
    
    return issueCount > 0 ? 'warning' : 'healthy';
  }
}