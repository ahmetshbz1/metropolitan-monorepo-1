//  "stripe-webhook.routes.ts"
//  metropolitan backend  
//  Streamlined webhook route handler using modular services
//  Refactored: Cleaner separation of concerns

import { Elysia } from "elysia";

import StripeService from "../../../../shared/infrastructure/external/stripe.service";
import { WebhookIdempotencyService } from "../../application/webhook/idempotency.service";
import { WebhookHealthService } from "../../application/webhook/webhook-health.service";
import { WebhookRouterService } from "../../application/webhook/webhook-router.service";
import { WebhookUtils } from "../../application/webhook/webhook-utils.service";

// Re-export types and services for backward compatibility
export type { 
  WebhookProcessingResult,
  WebhookEventMetadata,
  OrderStatusUpdate,
  SupportedWebhookEvent
} from "../../application/webhook/webhook-types";

export { PaymentIntentHandlersService } from "../../application/webhook/payment-intent-handlers.service";
export { WebhookIdempotencyService } from "../../application/webhook/idempotency.service";

export { WebhookUtils };

/**
 * Main Stripe Webhook Routes - Clean and focused endpoint handler
 */
export const stripeWebhookRoutes = new Elysia().group("/stripe", (app) =>
  app
    .post("/webhook", async ({ request, headers }) => {
      try {
        // 1. Validate Stripe signature
        const signature = headers["stripe-signature"];
        if (!signature) {
          throw new Error("Stripe signature missing");
        }

        // Get raw body and construct webhook event
        const rawBody = await request.text();
        const event = await StripeService.constructWebhookEvent(
          rawBody, 
          signature
        );

        console.log(`Stripe webhook received: ${event.type} - ${event.id}`);

        // 2. Check idempotency
        const idempotencyCheck = WebhookIdempotencyService.processEvent(
          event.id
        );
        
        if (!idempotencyCheck.shouldProcess) {
          console.log(idempotencyCheck.reason);
          return { 
            received: true, 
            status: "already_processed",
            eventId: event.id 
          };
        }

        console.log(idempotencyCheck.reason);

        // 3. Validate and route event
        const validation = WebhookRouterService.validateEvent(event);
        if (!validation.valid) {
          throw new Error(validation.error || "Invalid event");
        }

        const result = await WebhookRouterService.routeEvent(event);

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
          `Webhook error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    })
    
    // Health check endpoint
    .get("/webhook/health", async () => {
      const health = await WebhookHealthService.checkHealth();
      return health;
    })
    
    // Metrics endpoint
    .get("/webhook/metrics", async () => {
      const metrics = await WebhookHealthService.getMetrics();
      return metrics;
    })
);

