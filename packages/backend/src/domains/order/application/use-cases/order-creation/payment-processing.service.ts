//  "payment-processing.service.ts"
//  metropolitan backend
//  Orchestrator for payment processing operations

import type {
  OrderCreationRequest,
  OrderCreationResult,
  OrderItem as OrderItemData,
} from "@metropolitan/shared/types/order";
import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import { PaymentCalculatorService } from "./payment/payment-calculator.service";
import { StripePaymentProcessor } from "./payment/stripe-payment.processor";
import { CorporatePaymentProcessor } from "./payment/corporate-payment.processor";
import { OrderPayloadBuilder } from "./payment/order-payload.builder";
import { StripeOrderUpdater } from "./payment/stripe-order-updater";
import type { StripePaymentResult } from "./payment/stripe-payment.processor";

/**
 * Facade for payment processing operations
 * Coordinates between different payment processors and services
 */
export class PaymentProcessingService {
  /**
   * Calculate amount from cart (for backward compatibility)
   */
  static calculateAmountFromCart(cartItems: CartItemData[]): number {
    return PaymentCalculatorService.calculateAmountFromCart(cartItems);
  }

  /**
   * Create order metadata (for backward compatibility)
   */
  static createOrderMetadata(
    orderId: string,
    userId: string
  ): Record<string, string> {
    return {
      order_id: orderId,
      user_id: userId,
      source: "metropolitan_app",
    };
  }

  /**
   * Check if payment method is Stripe-based
   */
  static isStripePayment(paymentMethodId: string): boolean {
    return StripePaymentProcessor.isStripePayment(paymentMethodId);
  }

  /**
   * Create order payload for database insertion
   */
  static createOrderPayload(
    userId: string,
    request: OrderCreationRequest,
    totalAmount: number,
    isStripePayment: boolean
  ): any {
    return OrderPayloadBuilder.build(userId, request, totalAmount, isStripePayment);
  }

  /**
   * Handle corporate bank transfer auto-approval
   */
  static async handleCorporateBankTransfer(
    tx: any,
    order: any,
    orderItemsData: OrderItemData[],
    cartItemsData: CartItemData[],
    userId: string
  ): Promise<OrderCreationResult> {
    return CorporatePaymentProcessor.processCorporateBankTransfer(
      tx,
      order,
      orderItemsData,
      cartItemsData,
      userId
    );
  }

  /**
   * Process Stripe payment and create payment intent
   */
  static async processStripePayment(
    order: any,
    request: OrderCreationRequest,
    cartItemsData: CartItemData[],
    userId: string
  ): Promise<StripePaymentResult> {
    return StripePaymentProcessor.createPaymentIntent(
      order,
      request,
      cartItemsData,
      userId
    );
  }

  /**
   * Update order with Stripe payment information
   */
  static async updateOrderWithStripeInfo(
    tx: any,
    orderId: string,
    paymentIntentId: string,
    clientSecret: string
  ): Promise<void> {
    return StripeOrderUpdater.updateWithStripeInfo(
      tx,
      orderId,
      paymentIntentId,
      clientSecret
    );
  }
}