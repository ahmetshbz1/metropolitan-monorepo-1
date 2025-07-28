//  "payment-intent-handlers.service.ts"
//  metropolitan backend  
//  Focused service for handling different Stripe Payment Intent events
//  Extracted from stripe-webhook.routes.ts (payment intent handlers)

import type Stripe from "stripe";
import { WebhookOrderManagementService } from "./order-management.service";
import { WebhookStockRollbackService } from "./stock-rollback.service";
import { InvoiceService } from "../../../order/application/use-cases/invoice.service";
import type { WebhookProcessingResult, WebhookHandler } from "./webhook-types";

export class PaymentIntentHandlersService {

  /**
   * Handle successful payment intent
   */
  static async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<WebhookProcessingResult> {
    try {
      const orderInfo = WebhookOrderManagementService.extractOrderInfo(paymentIntent.metadata);
      
      if (!orderInfo.isValid || !orderInfo.orderId || !orderInfo.userId) {
        return {
          success: false,
          message: 'Invalid payment intent metadata',
          error: orderInfo.errors.join(', '),
        };
      }

      const { orderId, userId } = orderInfo;

      // Check idempotency - order already completed?
      const idempotencyCheck = await WebhookOrderManagementService.checkOrderIdempotency(
        orderId, 
        'completed'
      );

      if (!idempotencyCheck.shouldProcess) {
        console.log(`Order ${orderId} already completed, skipping...`);
        return {
          success: true,
          message: idempotencyCheck.reason,
          orderId,
        };
      }

      // Mark order as completed
      const orderUpdateResult = await WebhookOrderManagementService.markOrderCompleted(
        orderId,
        paymentIntent.id
      );

      if (!orderUpdateResult.success) {
        return orderUpdateResult;
      }

      console.log(`✅ Order ${orderId} payment completed successfully`);

      // Clear user's cart (if not already cleared)
      try {
        const cartResult = await WebhookOrderManagementService.clearUserCart(userId);
        console.log(cartResult.message);
      } catch (cartError) {
        console.error(`❌ Cart clearing failed for order ${orderId}:`, cartError);
        // Don't fail the webhook for cart clearing issues
      }

      // Generate invoice asynchronously (don't block webhook response)
      this.generateInvoiceAsync(orderId, userId);

      return {
        success: true,
        message: `Payment succeeded for order ${orderId}`,
        orderId,
      };
    } catch (error) {
      console.error("Error handling payment_intent.succeeded:", error);
      return {
        success: false,
        message: 'Error processing successful payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle failed payment intent
   */
  static async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<WebhookProcessingResult> {
    try {
      const orderInfo = WebhookOrderManagementService.extractOrderInfo(paymentIntent.metadata);
      
      if (!orderInfo.isValid || !orderInfo.orderId) {
        return {
          success: false,
          message: 'Invalid payment intent metadata',
          error: orderInfo.errors.join(', '),
        };
      }

      const { orderId } = orderInfo;

      // Mark order as failed
      const orderUpdateResult = await WebhookOrderManagementService.markOrderFailed(orderId);

      if (!orderUpdateResult.success) {
        return orderUpdateResult;
      }

      console.log(`❌ Order ${orderId} payment failed`);

      // Rollback stock since payment failed
      const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);
      
      if (!rollbackResult.success) {
        console.error(`Stock rollback failed for order ${orderId}:`, rollbackResult.errors);
        // Don't fail webhook for stock rollback issues, but log them
      }

      return {
        success: true,
        message: `Payment failed for order ${orderId}, stock rolled back`,
        orderId,
      };
    } catch (error) {
      console.error("Error handling payment_intent.payment_failed:", error);
      return {
        success: false,
        message: 'Error processing failed payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle payment intent that requires additional action (3D Secure, etc.)
   */
  static async handlePaymentRequiresAction(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<WebhookProcessingResult> {
    try {
      const orderInfo = WebhookOrderManagementService.extractOrderInfo(paymentIntent.metadata);
      
      if (!orderInfo.isValid || !orderInfo.orderId) {
        return {
          success: false,
          message: 'Invalid payment intent metadata',
          error: orderInfo.errors.join(', '),
        };
      }

      const { orderId } = orderInfo;

      // Mark order as requiring action
      const orderUpdateResult = await WebhookOrderManagementService.markOrderRequiresAction(orderId);

      if (!orderUpdateResult.success) {
        return orderUpdateResult;
      }

      console.log(`🔐 Order ${orderId} requires additional authentication`);

      return {
        success: true,
        message: `Order ${orderId} requires additional authentication`,
        orderId,
      };
    } catch (error) {
      console.error("Error handling payment_intent.requires_action:", error);
      return {
        success: false,
        message: 'Error processing payment requiring action',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle canceled payment intent
   */
  static async handlePaymentCanceled(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<WebhookProcessingResult> {
    try {
      const orderInfo = WebhookOrderManagementService.extractOrderInfo(paymentIntent.metadata);
      
      if (!orderInfo.isValid || !orderInfo.orderId || !orderInfo.userId) {
        return {
          success: false,
          message: 'Invalid payment intent metadata',
          error: orderInfo.errors.join(', '),
        };
      }

      const { orderId } = orderInfo;

      // Check idempotency - order already canceled?
      const idempotencyCheck = await WebhookOrderManagementService.checkOrderIdempotency(
        orderId, 
        'canceled'
      );

      if (!idempotencyCheck.shouldProcess) {
        console.log(`Order ${orderId} already canceled, skipping...`);
        return {
          success: true,
          message: idempotencyCheck.reason,
          orderId,
        };
      }

      // Mark order as canceled
      const orderUpdateResult = await WebhookOrderManagementService.markOrderCanceled(orderId);

      if (!orderUpdateResult.success) {
        return orderUpdateResult;
      }

      console.log(`🚫 Order ${orderId} payment canceled`);

      // Rollback stock since payment was canceled
      const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);
      
      if (!rollbackResult.success) {
        console.error(`Stock rollback failed for canceled order ${orderId}:`, rollbackResult.errors);
      }

      return {
        success: true,
        message: `Payment canceled for order ${orderId}, stock rolled back`,
        orderId,
      };
    } catch (error) {
      console.error("Error handling payment_intent.canceled:", error);
      return {
        success: false,
        message: 'Error processing canceled payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle processing payment intent
   */
  static async handlePaymentProcessing(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<WebhookProcessingResult> {
    try {
      const orderInfo = WebhookOrderManagementService.extractOrderInfo(paymentIntent.metadata);
      
      if (!orderInfo.isValid || !orderInfo.orderId) {
        return {
          success: false,
          message: 'Invalid payment intent metadata',
          error: orderInfo.errors.join(', '),
        };
      }

      const { orderId } = orderInfo;

      // Mark order as processing
      const orderUpdateResult = await WebhookOrderManagementService.markOrderProcessing(orderId);

      if (!orderUpdateResult.success) {
        return orderUpdateResult;
      }

      console.log(`⏳ Order ${orderId} payment is processing`);

      return {
        success: true,
        message: `Order ${orderId} payment is processing`,
        orderId,
      };
    } catch (error) {
      console.error("Error handling payment_intent.processing:", error);
      return {
        success: false,
        message: 'Error processing payment in progress',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate invoice asynchronously (non-blocking)
   */
  private static generateInvoiceAsync(orderId: string, userId: string): void {
    // Run in background without blocking webhook response
    Promise.resolve().then(async () => {
      try {
        console.log(`📄 Generating invoice for order ${orderId}...`);
        await InvoiceService.generateInvoicePDF(orderId, userId);
        console.log(`✅ Invoice generated successfully for order ${orderId}`);
      } catch (invoiceError) {
        // Invoice errors don't affect payment success, just log them
        console.error(
          `❌ Invoice generation failed for order ${orderId}:`,
          invoiceError
        );
      }
    });
  }

  /**
   * Get all available payment intent handlers
   */
  static getHandlers(): WebhookHandler[] {
    return [
      {
        eventType: 'payment_intent.succeeded',
        handle: this.handlePaymentSucceeded.bind(this),
      },
      {
        eventType: 'payment_intent.payment_failed',
        handle: this.handlePaymentFailed.bind(this),
      },
      {
        eventType: 'payment_intent.requires_action',
        handle: this.handlePaymentRequiresAction.bind(this),
      },
      {
        eventType: 'payment_intent.canceled',
        handle: this.handlePaymentCanceled.bind(this),
      },
      {
        eventType: 'payment_intent.processing',
        handle: this.handlePaymentProcessing.bind(this),
      },
    ];
  }

  /**
   * Get handler for specific event type
   */
  static getHandler(eventType: string): WebhookHandler | null {
    const handlers = this.getHandlers();
    return handlers.find(handler => handler.eventType === eventType) || null;
  }
}