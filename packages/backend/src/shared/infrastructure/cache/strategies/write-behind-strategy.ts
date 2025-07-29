//  "write-behind-strategy.ts"
//  metropolitan backend
//  Write-behind (write-back) cache pattern

import { ApiCacheService } from "../api-cache.service";

export interface WriteBehindOptions {
  flushInterval?: number;
  maxBatchSize?: number;
}

export class WriteBehindStrategy<T> {
  private writeQueue = new Map<string, { data: T; timestamp: number }>();
  private flushTimer: Timer | null = null;
  private readonly flushInterval: number;
  private readonly maxBatchSize: number;
  
  constructor(options?: WriteBehindOptions) {
    this.flushInterval = options?.flushInterval ?? 5000; // 5 seconds
    this.maxBatchSize = options?.maxBatchSize ?? 100;
  }
  
  async write(
    key: string,
    data: T,
    persistFn: (batch: Map<string, T>) => Promise<void>
  ): Promise<void> {
    // Update cache immediately
    await ApiCacheService.set(key, data);
    
    // Add to write queue
    this.writeQueue.set(key, { data, timestamp: Date.now() });
    
    // Flush if batch size reached
    if (this.writeQueue.size >= this.maxBatchSize) {
      await this.flush(persistFn);
    } else {
      this.scheduleFlush(persistFn);
    }
  }
  
  async flush(persistFn: (batch: Map<string, T>) => Promise<void>): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    if (this.writeQueue.size === 0) return;
    
    const batch = new Map<string, T>();
    this.writeQueue.forEach((item, key) => {
      batch.set(key, item.data);
    });
    
    this.writeQueue.clear();
    
    try {
      await persistFn(batch);
    } catch (error) {
      console.error("Write-behind flush failed:", error);
      // Re-add items to queue on failure
      batch.forEach((data, key) => {
        this.writeQueue.set(key, { data, timestamp: Date.now() });
      });
    }
  }
  
  private scheduleFlush(persistFn: (batch: Map<string, T>) => Promise<void>): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    
    this.flushTimer = setTimeout(() => this.flush(persistFn), this.flushInterval);
  }
}