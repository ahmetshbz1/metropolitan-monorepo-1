// payment-intent-handlers.service.ts
// Orchestrator service for handling Stripe Payment Intent events

import type Stripe from "stripe";
import { PaymentIntentValidatorService } from "./payment-intent-validator.service";
import { PaymentStateHandlersService } from "./payment-state-handlers.service";
import type { WebhookProcessingResult, WebhookHandler } from "./webhook-types";

export class PaymentIntentHandlersService {
  /**
   * Handle successful payment intent
   */
  static async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<WebhookProcessingResult> {
    try {
      const validation = PaymentIntentValidatorService.validate(paymentIntent, true);
      
      if (!validation.isValid) {
        return PaymentIntentValidatorService.createValidationErrorResponse(validation);
      }

      return await PaymentStateHandlersService.handleSuccess(
        validation.orderId!,
        validation.userId!,
        paymentIntent.id
      );
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
      const validation = PaymentIntentValidatorService.validate(paymentIntent);
      
      if (!validation.isValid) {
        return PaymentIntentValidatorService.createValidationErrorResponse(validation);
      }

      return await PaymentStateHandlersService.handleFailure(validation.orderId!);
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
   * Handle payment requiring action
   */
  static async handlePaymentRequiresAction(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<WebhookProcessingResult> {
    try {
      const validation = PaymentIntentValidatorService.validate(paymentIntent);
      
      if (!validation.isValid) {
        return PaymentIntentValidatorService.createValidationErrorResponse(validation);
      }

      return await PaymentStateHandlersService.handleRequiresAction(validation.orderId!);
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
      const validation = PaymentIntentValidatorService.validate(paymentIntent);
      
      if (!validation.isValid) {
        return PaymentIntentValidatorService.createValidationErrorResponse(validation);
      }

      return await PaymentStateHandlersService.handleCancellation(validation.orderId!);
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
      const validation = PaymentIntentValidatorService.validate(paymentIntent);
      
      if (!validation.isValid) {
        return PaymentIntentValidatorService.createValidationErrorResponse(validation);
      }

      return await PaymentStateHandlersService.handleProcessing(validation.orderId!);
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