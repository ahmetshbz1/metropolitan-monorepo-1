//  "stripe-webhook.routes.ts"
//  metropolitan backend  
//  Main orchestrator for Stripe webhook processing
//  Refactored: Now delegates to focused modular services for better maintainability

import { Elysia } from "elysia";
import type Stripe from "stripe";

// Import focused modular services
import StripeService from "../../../../shared/infrastructure/external/stripe.service";
import { WebhookIdempotencyService } from "../../application/webhook/idempotency.service";
import { PaymentIntentHandlersService } from "../../application/webhook/payment-intent-handlers.service";
import type { SupportedWebhookEvent } from "../../application/webhook/webhook-types";

// Re-export types for backward compatibility
export type { 
  WebhookProcessingResult,
  WebhookEventMetadata,
  OrderStatusUpdate,
  SupportedWebhookEvent
} from "../../application/webhook/webhook-types";

/**
 * Main Stripe Webhook Routes - Now acts as orchestrator for modular services
 * Maintains backward compatibility while providing better code organization
 */
export const stripeWebhookRoutes = new Elysia().group("/stripe", (app) =>
  app.post("/webhook", async ({ request, headers }) => {
    try {
      // 1. Validate Stripe signature
      const signature = headers["stripe-signature"];
      if (!signature) {
        throw new Error("Stripe signature missing");
      }

      // Get raw body and construct webhook event
      const rawBody = await request.text();
      const event = await StripeService.constructWebhookEvent(rawBody, signature);

      console.log(`Stripe webhook received: ${event.type} - ${event.id}`);

      // 2. Check idempotency using modular service
      const idempotencyCheck = WebhookIdempotencyService.processEvent(event.id);
      
      if (!idempotencyCheck.shouldProcess) {
        console.log(idempotencyCheck.reason);
        return { 
          received: true, 
          status: "already_processed",
          eventId: event.id 
        };
      }

      console.log(idempotencyCheck.reason);

      // 3. Route event to appropriate handler using modular service
      const result = await routeWebhookEvent(event);

      return { 
        received: true, 
        status: result.success ? "processed" : "error",
        eventId: event.id,
        orderId: result.orderId,
        message: result.message,
        error: result.error
      };
    } catch (error) {
      console.error("Stripe webhook error:", error);
      throw new Error(
        `Webhook error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  })
);

/**
 * Route webhook event to appropriate handler
 */
async function routeWebhookEvent(event: Stripe.Event) {
  const eventType = event.type as SupportedWebhookEvent;

  // Get handler for this event type
  const handler = PaymentIntentHandlersService.getHandler(eventType);
  
  if (!handler) {
    console.log(`Unhandled webhook event type: ${event.type}`);
    return {
      success: true,
      message: `Event type ${event.type} ignored (not implemented)`,
    };
  }

  // Process the event using the appropriate handler
  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const result = await handler.handle(paymentIntent);
    
    if (result.success) {
      console.log(`✅ Successfully processed ${event.type} for order ${result.orderId}`);
    } else {
      console.error(`❌ Failed to process ${event.type}: ${result.message}`);
    }
    
    return result;
  } catch (handlerError) {
    console.error(`Handler error for ${event.type}:`, handlerError);
    return {
      success: false,
      message: `Handler error for ${event.type}`,
      error: handlerError instanceof Error ? handlerError.message : 'Unknown handler error',
    };
  }
}

/**
 * Webhook management utilities
 */
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
  private static getEventDescription(eventType: SupportedWebhookEvent): string {
    const descriptions: Record<SupportedWebhookEvent, string> = {
      'payment_intent.succeeded': 'Payment completed successfully',
      'payment_intent.payment_failed': 'Payment failed to process',
      'payment_intent.requires_action': 'Payment requires additional authentication',
      'payment_intent.canceled': 'Payment canceled by customer',
      'payment_intent.processing': 'Payment is being processed',
    };
    
    return descriptions[eventType] || 'Unknown event type';
  }

  /**
   * Health check for webhook system
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    services: {
      idempotency: boolean;
      handlers: boolean;
      stripe: boolean;
    };
    stats: {
      supportedEvents: number;
      availableHandlers: number;
      cacheUtilization: number;
    };
    issues: string[];
  }> {
    const issues: string[] = [];
    const services = {
      idempotency: true, // In-memory service, always available
      handlers: true,    // Static service, always available
      stripe: false,
    };

    // Check Stripe service
    try {
      // This is a basic check - could be enhanced
      if (StripeService) {
        services.stripe = true;
      }
    } catch (error) {
      issues.push('Stripe service not available');
    }

    const stats = {
      supportedEvents: this.getSupportedEvents().length,
      availableHandlers: PaymentIntentHandlersService.getHandlers().length,
      cacheUtilization: WebhookIdempotencyService.getStats().cacheUtilization,
    };

    // Check cache utilization
    if (stats.cacheUtilization > 90) {
      issues.push('Webhook idempotency cache is near capacity');
    }

    const status = issues.length === 0 ? 'healthy' : 
                  issues.length === 1 ? 'warning' : 'error';

    return {
      status,
      services,
      stats,
      issues,
    };
  }
}

// Legacy compatibility exports
export { WebhookIdempotencyService, PaymentIntentHandlersService };