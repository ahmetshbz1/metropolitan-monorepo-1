//  "stock-monitoring.service.ts"
//  metropolitan backend  
//  Focused service for stock monitoring and analytics
//  Extracted from redis-stock.service.ts (lines 258-295)

import { redis } from "../../database/redis";

import { REDIS_STOCK_CONFIG, type StockActivity } from "./stock-config";

export class StockMonitoringService {
  private static readonly RESERVATION_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.RESERVATION;

  /**
   * Monitor real-time stock changes for specific product (for admin dashboard)
   * Uses SCAN for production safety
   */
  static async getStockActivity(productId: string): Promise<StockActivity[]> {
    const pattern = `${this.RESERVATION_PREFIX}*:${productId}`;
    const activities: StockActivity[] = [];
    
    return new Promise((resolve, reject) => {
      const stream = redis.scanStream({
        match: pattern,
        count: 100,
      });
      
      stream.on('data', async (keys: string[]) => {
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.get(key));
        
        const results = await pipeline.exec();
        if (results) {
          results.forEach(([err, data]) => {
            if (!err && data) {
              try {
                const activity = JSON.parse(data as string);
                activities.push(activity);
              } catch (parseError) {
                console.warn('Failed to parse stock activity data:', parseError);
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
   * Get all stock activities across all products (admin dashboard)
   */
  static async getAllStockActivities(limit: number = 100): Promise<StockActivity[]> {
    const pattern = `${this.RESERVATION_PREFIX}*`;
    const activities: StockActivity[] = [];
    
    return new Promise((resolve, reject) => {
      const stream = redis.scanStream({
        match: pattern,
        count: limit,
      });
      
      stream.on('data', async (keys: string[]) => {
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.get(key));
        
        const results = await pipeline.exec();
        if (results) {
          results.forEach(([err, data]) => {
            if (!err && data) {
              try {
                const activity = JSON.parse(data as string);
                activities.push(activity);
              } catch (parseError) {
                console.warn('Failed to parse stock activity data:', parseError);
              }
            }
          });
        }
      });
      
      stream.on('end', () => {
        const sorted = activities
          .sort(
            (a, b) =>
              new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime()
          )
          .slice(0, limit);
        resolve(sorted);
      });
      
      stream.on('error', (err) => {
        console.error('Error fetching all stock activities:', err);
        reject(err);
      });
    });
  }

  /**
   * Get stock activity statistics for analytics
   */  
  static async getStockStats(): Promise<{
    totalReservations: number;
    confirmedReservations: number;
    rolledBackReservations: number;
    pendingReservations: number;
  }> {
    const pattern = `${this.RESERVATION_PREFIX}*`;
    const stats = {
      totalReservations: 0,
      confirmedReservations: 0,
      rolledBackReservations: 0,
      pendingReservations: 0,
    };
    
    return new Promise((resolve, reject) => {
      const stream = redis.scanStream({
        match: pattern,
        count: 100,
      });
      
      stream.on('data', async (keys: string[]) => {
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.get(key));
        
        const results = await pipeline.exec();
        if (results) {
          results.forEach(([err, data]) => {
            if (!err && data) {
              try {
                const activity = JSON.parse(data as string);
                stats.totalReservations++;
                
                switch (activity.status) {
                  case 'confirmed':
                    stats.confirmedReservations++;
                    break;
                  case 'rolled_back':
                    stats.rolledBackReservations++;
                    break;
                  case 'reserved':
                    stats.pendingReservations++;
                    break;
                }
              } catch (parseError) {
                console.warn('Failed to parse stock stats data:', parseError);
              }
            }
          });
        }
      });
      
      stream.on('end', () => {
        resolve(stats);
      });
      
      stream.on('error', (err) => {
        console.error('Error fetching stock stats:', err);
        reject(err);
      });
    });
  }

  /**
   * Get active reservations (not yet confirmed or rolled back)
   */
  static async getActiveReservations(): Promise<StockActivity[]> {
    const allActivities = await this.getAllStockActivities(1000);
    return allActivities.filter(activity => activity.status === 'reserved');
  }

  /**
   * Check if a product has any pending reservations
   */
  static async hasPendingReservations(productId: string): Promise<boolean> {
    const activities = await this.getStockActivity(productId);
    return activities.some(activity => activity.status === 'reserved');
  }
}