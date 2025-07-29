//  "webhook-utils.service.ts"
//  metropolitan backend
//  Webhook management utilities separated from routes

import { WebhookIdempotencyService } from "./idempotency.service";
import { PaymentIntentHandlersService } from "./payment-intent-handlers.service";
import type { SupportedWebhookEvent } from "./webhook-types";

export class WebhookUtils {
  /**
   * Get webhook processing statistics
   */
  static getIdempotencyStats() {
    return WebhookIdempotencyService.getStats();
  }

  /**
   * Clear processed events cache (for testing)
   */
  static clearIdempotencyCache() {
    return WebhookIdempotencyService.clear();
  }

  /**
   * Get list of supported webhook events
   */
  static getSupportedEvents(): SupportedWebhookEvent[] {
    return [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.requires_action',
      'payment_intent.canceled',
      'payment_intent.processing',
    ];
  }

  /**
   * Check if event type is supported
   */
  static isEventSupported(eventType: string): boolean {
    return this.getSupportedEvents().includes(eventType as SupportedWebhookEvent);
  }

  /**
   * Get available payment intent handlers
   */
  static getAvailableHandlers() {
    return PaymentIntentHandlersService.getHandlers().map(h => ({
      eventType: h.eventType,
      description: this.getEventDescription(h.eventType),
    }));
  }

  /**
   * Get human-readable description for webhook event
   */
  static getEventDescription(eventType: SupportedWebhookEvent): string {
    const descriptions: Record<SupportedWebhookEvent, string> = {
      'payment_intent.succeeded': 'Payment completed successfully',
      'payment_intent.payment_failed': 'Payment failed to process',
      'payment_intent.requires_action': 'Payment requires additional authentication',
      'payment_intent.canceled': 'Payment canceled by customer',
      'payment_intent.processing': 'Payment is being processed',
    };
    
    return descriptions[eventType] || 'Unknown event type';
  }
}