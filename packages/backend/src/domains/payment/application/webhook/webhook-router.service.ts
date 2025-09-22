//  "webhook-router.service.ts"
//  metropolitan backend
//  Routes webhook events to appropriate handlers

import type Stripe from "stripe";

import { PaymentIntentHandlersService } from "./payment-intent-handlers.service";
import type { SupportedWebhookEvent } from "./webhook-types";

export interface WebhookRoutingResult {
  success: boolean;
  orderId?: string;
  message: string;
  error?: string;
}

export class WebhookRouterService {
  /**
   * Route webhook event to appropriate handler
   */
  static async routeEvent(event: Stripe.Event): Promise<WebhookRoutingResult> {
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
        console.log(
          `✅ Successfully processed ${event.type} for order ${result.orderId}`
        );
      } else {
        console.error(
          `❌ Failed to process ${event.type}: ${result.message}`
        );
      }
      
      return result;
    } catch (handlerError) {
      console.error(`Handler error for ${event.type}:`, handlerError);
      return {
        success: false,
        message: `Handler error for ${event.type}`,
        error: handlerError instanceof Error 
          ? handlerError.message 
          : 'Unknown handler error',
      };
    }
  }

  /**
   * Validate event before routing
   */
  static validateEvent(event: Stripe.Event): {
    valid: boolean;
    error?: string;
  } {
    if (!event || !event.type) {
      return {
        valid: false,
        error: 'Invalid event structure',
      };
    }

    if (!event.data || !event.data.object) {
      return {
        valid: false,
        error: 'Event data missing',
      };
    }

    // Check if it's a payment intent event
    if (event.type.startsWith('payment_intent.')) {
      const paymentIntent = event.data.object as any;
      if (!paymentIntent.id || !paymentIntent.metadata) {
        return {
          valid: false,
          error: 'Invalid payment intent structure',
        };
      }
    }

    return { valid: true };
  }
}