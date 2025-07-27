//  "payment.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.

// Stripe Payment Intent Response for mobile app
export interface StripePaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

// Payment status types for orders
export type PaymentStatus =
  | "pending"
  | "requires_action"
  | "succeeded"
  | "canceled"
  | "processing"
  | "requires_payment_method";

// Payment method types supported by Stripe
export type PaymentMethodType =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "blik"
  | null;

// Stripe payment processing result
export interface StripePaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  requiresAction?: boolean;
  error?: string;
}

// Payment processor parameters
export interface PaymentProcessorParams {
  clientSecret: string;
  t: (key: string) => string;
}

export interface PlatformPayParams extends PaymentProcessorParams {
  confirmPlatformPayPayment: any;
}

export interface CardPaymentParams extends PaymentProcessorParams {
  paymentMethodType?: string;
  initPaymentSheet: any;
  presentPaymentSheet: any;
}
