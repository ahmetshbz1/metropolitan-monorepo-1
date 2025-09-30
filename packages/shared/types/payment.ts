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
  | "bank_transfer"
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
  confirmPlatformPayPayment: (clientSecret: string, params: any) => Promise<{ error?: { message: string } }>;
  amount?: string;
  currency?: string;
}

export interface CardPaymentParams extends PaymentProcessorParams {
  paymentMethodType?: string;
  initPaymentSheet: (params: { paymentIntentClientSecret: string }) => Promise<{ error?: { message: string } }>;
  presentPaymentSheet: () => Promise<{ error?: { message: string } }>;
}

// Saved payment method types for user payment methods management
export interface SavedPaymentMethod {
  id: string;
  /** Payment method type (e.g., "card", "blik") */
  type: string;
  /** Display name for the payment method */
  name: string;
  /** Masked details (e.g., "•••• 4242" for cards) */
  details: string;
  /** Expiry date in MM/YY format (for cards) */
  expiry?: string;
  /** Whether this is the default payment method */
  isDefault: boolean;
  /** User ID who owns this payment method */
  userId?: string;
  /** Creation timestamp */
  createdAt?: string | Date;
}

export interface SavedPaymentMethodData {
  /** Payment method type (e.g., "card", "blik") */
  type: string;
  /** Display name for the payment method */
  name: string;
  /** Masked details (e.g., "•••• 4242" for cards) */
  details: string;
  /** Expiry date in MM/YY format (for cards) */
  expiry?: string;
}

export interface PaymentTermsSettings {
  id: string;
  isGlobalDefault: boolean;
  availableTerms: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserPaymentTerms {
  id: string;
  userId: string;
  customTerms: string | null;
  isEnabled: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaymentTermOption {
  days: number;
  label: string;
}

export interface GetPaymentTermsResponse {
  success: boolean;
  data: PaymentTermOption[];
}
