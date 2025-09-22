//  "stripe-payment.processor.ts"
//  metropolitan backend
//  Stripe-specific payment processing logic

import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import type { OrderCreationRequest } from "@metropolitan/shared/types/order";

import StripeService from "../../../../../../shared/infrastructure/external/stripe.service";

import { PaymentCalculatorService } from "./payment-calculator.service";

export interface StripePaymentResult {
  paymentIntentId: string;
  clientSecret: string;
}

export class StripePaymentProcessor {
  private static readonly SUPPORTED_PAYMENT_TYPES = [
    "card",
    "bank_transfer",
    "blik",
    "apple_pay",
    "google_pay",
  ];
  
  /**
   * Check if payment method is Stripe-based
   */
  static isStripePayment(paymentMethodId: string): boolean {
    return this.SUPPORTED_PAYMENT_TYPES.includes(paymentMethodId);
  }
  
  /**
   * Create Stripe payment intent
   */
  static async createPaymentIntent(
    order: any,
    request: OrderCreationRequest,
    cartItems: CartItemData[],
    userId: string
  ): Promise<StripePaymentResult> {
    const amountInCents = PaymentCalculatorService.calculateAmountFromCart(cartItems);
    
    const paymentIntentParams = this.buildPaymentIntentParams(
      amountInCents,
      order.id,
      userId,
      request.paymentMethodId
    );
    
    const paymentIntent = await StripeService.createPaymentIntent(paymentIntentParams);
    
    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }
  
  /**
   * Build Stripe payment intent parameters
   */
  private static buildPaymentIntentParams(
    amountInCents: number,
    orderId: string,
    userId: string,
    paymentMethodId: string
  ): any {
    const params: any = {
      amount: amountInCents,
      currency: "pln", // All sales in PLN
      metadata: this.createOrderMetadata(orderId, userId),
    };
    
    // Configure payment method types based on selection
    console.log("🔧 Payment method ID:", paymentMethodId);
    
    if (paymentMethodId === "card") {
      params.paymentMethodTypes = ["card"];
      console.log("💳 Using card payment methods only");
    } else if (paymentMethodId === "blik") {
      params.paymentMethodTypes = ["blik"];
      // BLIK is Poland-specific, currency must be PLN
      if (params.currency !== "pln") {
        console.warn("⚠️ BLIK requires PLN currency, forcing to pln");
        params.currency = "pln";
      }
      console.log("📱 Using BLIK payment methods only");
    } else {
      console.log("🔄 Using automatic payment methods");
    }
    
    return params;
  }
  
  /**
   * Create metadata for Stripe payment
   */
  private static createOrderMetadata(
    orderId: string,
    userId: string
  ): Record<string, string> {
    return {
      order_id: orderId,
      user_id: userId,
      source: "metropolitan_app",
    };
  }
}