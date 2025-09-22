// payment-intent-validator.service.ts
// Validation and metadata extraction for Stripe payment intents

import type Stripe from "stripe";

import { WebhookOrderManagementService } from "./order-management.service";
import type { WebhookProcessingResult } from "./webhook-types";

export interface ValidatedPaymentIntent {
  isValid: boolean;
  orderId?: string;
  userId?: string;
  errors: string[];
  paymentIntent: Stripe.PaymentIntent;
}

export class PaymentIntentValidatorService {
  /**
   * Validate payment intent and extract metadata
   */
  static validate(paymentIntent: Stripe.PaymentIntent, requireUserId = false): ValidatedPaymentIntent {
    const orderInfo = WebhookOrderManagementService.extractOrderInfo(paymentIntent.metadata);
    
    const result: ValidatedPaymentIntent = {
      isValid: orderInfo.isValid,
      orderId: orderInfo.orderId,
      userId: orderInfo.userId,
      errors: orderInfo.errors,
      paymentIntent
    };

    // Additional validation for userId if required
    if (requireUserId && !result.userId) {
      result.isValid = false;
      result.errors.push('Missing userId in metadata');
    }

    return result;
  }

  /**
   * Create validation error response
   */
  static createValidationErrorResponse(validation: ValidatedPaymentIntent): WebhookProcessingResult {
    return {
      success: false,
      message: 'Invalid payment intent metadata',
      error: validation.errors.join(', '),
    };
  }

  /**
   * Check if order should be processed based on idempotency
   */
  static async checkIdempotency(
    orderId: string, 
    targetStatus: string
  ): Promise<{ shouldProcess: boolean; reason: string }> {
    return WebhookOrderManagementService.checkOrderIdempotency(orderId, targetStatus);
  }
}