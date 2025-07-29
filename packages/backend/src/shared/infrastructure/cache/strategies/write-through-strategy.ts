//  "write-through-strategy.ts"
//  metropolitan backend
//  Write-through cache pattern

import { ApiCacheService } from "../api-cache.service";

export class WriteThroughStrategy {
  /**
   * Write-through cache pattern
   * Writes to database first, then updates cache
   */
  static async execute<T>(
    key: string,
    data: T,
    persistFn: (data: T) => Promise<void>,
    ttl: number = 300
  ): Promise<void> {
    // Write to database first
    await persistFn(data);
    
    // Then update cache
    await ApiCacheService.set(key, data, { ttl });
  }
}