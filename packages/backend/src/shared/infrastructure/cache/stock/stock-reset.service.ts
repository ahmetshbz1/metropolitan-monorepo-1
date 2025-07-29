//  "stock-reset.service.ts"
//  metropolitan backend
//  Emergency stock data reset service

import { redis } from "../../database/redis";
import { REDIS_STOCK_CONFIG } from "./stock-config";

export class StockResetService {
  /**
   * Reset all stock data in Redis (emergency use only)
   * WARNING: This will delete all stock, lock, and reservation data
   */
  static async resetAllStockData(): Promise<void> {
    const stockPattern = `${REDIS_STOCK_CONFIG.KEY_PREFIXES.STOCK}*`;
    const lockPattern = `${REDIS_STOCK_CONFIG.KEY_PREFIXES.LOCK}*`;
    const reservationPattern = `${REDIS_STOCK_CONFIG.KEY_PREFIXES.RESERVATION}*`;
    
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
}