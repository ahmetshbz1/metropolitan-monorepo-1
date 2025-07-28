//  "idempotency.service.ts"
//  metropolitan backend  
//  Focused service for webhook event idempotency management
//  Extracted from stripe-webhook.routes.ts (lines 14-50)

import type { IdempotencyManager } from "./webhook-types";

/**
 * Manages webhook event idempotency to prevent duplicate processing
 * Uses in-memory Set with automatic cleanup to prevent memory leaks
 */
export class WebhookIdempotencyService implements IdempotencyManager {
  private static processedEvents = new Set<string>();
  private static readonly MAX_CACHE_SIZE = 1000;

  /**
   * Check if event has already been processed
   */
  static has(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Mark event as processed
   */
  static add(eventId: string): void {
    this.processedEvents.add(eventId);
    
    // Prevent memory leak by limiting cache size
    this.cleanup();
  }

  /**
   * Clean up old events to prevent memory bloat
   */
  static cleanup(): void {
    if (this.processedEvents.size > this.MAX_CACHE_SIZE) {
      // Remove the oldest event (first in Set iteration order)
      const oldestEvent = this.processedEvents.values().next().value;
      this.processedEvents.delete(oldestEvent);
    }
  }

  /**
   * Clear all processed events (for testing or reset)
   */
  static clear(): void {
    this.processedEvents.clear();
  }

  /**
   * Get current cache statistics
   */
  static getStats(): {
    cacheSize: number;
    maxCacheSize: number;
    cacheUtilization: number;
  } {
    return {
      cacheSize: this.processedEvents.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      cacheUtilization: (this.processedEvents.size / this.MAX_CACHE_SIZE) * 100,
    };
  }

  /**
   * Check if event should be processed (not already processed)
   */
  static shouldProcess(eventId: string): boolean {
    return !this.has(eventId);
  }

  /**
   * Process event with automatic idempotency handling
   * Returns true if event should be processed, false if already processed
   */
  static processEvent(eventId: string): { shouldProcess: boolean; reason: string } {
    if (this.has(eventId)) {
      return {
        shouldProcess: false,
        reason: `Event ${eventId} already processed`,
      };
    }

    this.add(eventId);
    return {
      shouldProcess: true,
      reason: `Event ${eventId} marked for processing`,
    };
  }

  /**
   * Bulk check multiple events
   */
  static checkMultiple(eventIds: string[]): Array<{
    eventId: string;
    alreadyProcessed: boolean;
  }> {
    return eventIds.map(eventId => ({
      eventId,
      alreadyProcessed: this.has(eventId),
    }));
  }
}