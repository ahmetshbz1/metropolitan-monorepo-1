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
