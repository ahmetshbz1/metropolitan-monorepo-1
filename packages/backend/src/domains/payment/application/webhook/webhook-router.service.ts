//  "webhook-router.service.ts"
//  metropolitan backend
//  Routes webhook events to appropriate handlers

import type Stripe from "stripe";

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
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
      logger.info({ eventType: event.type }, "Unhandled webhook event type");
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
        logger.info({ eventType: event.type, orderId: result.orderId }, "Successfully processed webhook event");
      } else {
        logger.error({ eventType: event.type, message: result.message }, "Failed to process webhook event");
      }

      return result;
    } catch (handlerError) {
      logger.error({
        eventType: event.type,
        error: handlerError instanceof Error ? handlerError.message : String(handlerError),
        stack: handlerError instanceof Error ? handlerError.stack : undefined
      }, "Handler error for webhook event");
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