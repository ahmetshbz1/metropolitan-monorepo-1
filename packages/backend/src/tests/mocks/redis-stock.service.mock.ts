// "redis-stock.service.mock.ts"
// Mock Redis stock service for testing

import { MockRedis } from './redis.mock';

export interface StockReservationResult {
  success: boolean;
  remainingStock?: number;
  error?: string;
}

export interface ReservationData {
  productId: string;
  userId: string;
  quantity: number;
  reservedAt: string;
  status: 'reserved' | 'rolled_back';
  rolledBackAt?: string;
}

export class MockRedisStockService {
  private static redis = new MockRedis();
  private static LOCK_TIMEOUT = 5000;
  private static STOCK_PREFIX = "stock:";
  private static LOCK_PREFIX = "stock_lock:";
  private static RESERVATION_PREFIX = "reservation:";

  static async reserveStockAtomic(
    productId: string, 
    userId: string, 
    quantity: number
  ): Promise<StockReservationResult> {
    
    const lockKey = `${this.LOCK_PREFIX}${productId}`;
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const reservationKey = `${this.RESERVATION_PREFIX}${userId}:${productId}`;
    
    // Acquire lock
    const lockAcquired = await this.redis.set(
      lockKey, 
      userId, 
      'PX', this.LOCK_TIMEOUT, 
      'NX'
    );
    
    if (!lockAcquired) {
      return { 
        success: false, 
        error: "Another user is currently processing this product." 
      };
    }

    try {
      // Get current stock
      const currentStock = await this.redis.get(stockKey);
      const availableStock = currentStock ? parseInt(currentStock) : 0;
      
      if (availableStock < quantity) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
        };
      }
      
      // Reserve stock
      const newStock = await this.redis.decrby(stockKey, quantity);
      
      // Store reservation
      await this.redis.setex(reservationKey, 3600, JSON.stringify({
        productId,
        userId,
        quantity,
        reservedAt: new Date().toISOString(),
        status: 'reserved'
      }));
      
      return {
        success: true,
        remainingStock: newStock
      };
      
    } finally {
      await this.redis.del(lockKey);
    }
  }

  static async rollbackReservation(userId: string, productId: string): Promise<void> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const reservationKey = `${this.RESERVATION_PREFIX}${userId}:${productId}`;
    
    const reservationData = await this.redis.get(reservationKey);
    if (!reservationData) return;
    
    const reservation = JSON.parse(reservationData) as ReservationData;
    await this.redis.incrby(stockKey, reservation.quantity);
    
    await this.redis.setex(reservationKey, 3600, JSON.stringify({
      ...reservation,
      status: 'rolled_back',
      rolledBackAt: new Date().toISOString()
    }));
  }

  static async syncStockFromDB(productId: string, stockAmount: number): Promise<void> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    await this.redis.set(stockKey, stockAmount.toString());
  }

  static async getCurrentStock(productId: string): Promise<number> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const stock = await this.redis.get(stockKey);
    return stock ? parseInt(stock) : 0;
  }

  // Test utilities
  static clearRedis(): void {
    this.redis.clear();
  }

  static getRedisStore(): Map<string, string> {
    return this.redis.getStore();
  }
}