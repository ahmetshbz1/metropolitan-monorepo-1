//  "webhook-types.ts"
//  metropolitan backend  
//  Types and interfaces for Stripe webhook processing
//  Extracted from stripe-webhook.routes.ts for better modularity

import type Stripe from "stripe";

export interface WebhookEventMetadata {
  order_id?: string;
  user_id?: string;
}

export interface OrderStatusUpdate {
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled' | 'requires_action';
  status: 'pending' | 'processing' | 'confirmed' | 'canceled';
  paidAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  updatedAt: Date;
}

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  orderId?: string;
  error?: string;
}

export interface IdempotencyManager {
  has(eventId: string): boolean;
  add(eventId: string): void;
  cleanup(): void;
}

export type SupportedWebhookEvent = 
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.requires_action'
  | 'payment_intent.canceled'
  | 'payment_intent.processing';

export interface WebhookHandler {
  eventType: SupportedWebhookEvent;
  handle(paymentIntent: Stripe.PaymentIntent): Promise<WebhookProcessingResult>;
}