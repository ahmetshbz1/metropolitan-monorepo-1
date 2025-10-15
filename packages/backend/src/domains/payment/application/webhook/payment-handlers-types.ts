// payment-handlers-types.ts
// Type definitions and interfaces for payment state handlers

export type { WebhookProcessingResult } from "./webhook-types";

/**
 * Order bilgisi için interface
 */
export interface OrderInfo {
  id: string;
  userId: string;
  orderNumber: string;
}

/**
 * Success handler parametreleri
 */
export interface SuccessHandlerParams {
  orderId: string;
  userId: string;
  paymentIntentId: string;
}

/**
 * Failure handler parametreleri
 */
export interface FailureHandlerParams {
  orderId: string;
}

/**
 * Cancellation handler parametreleri
 */
export interface CancellationHandlerParams {
  orderId: string;
}

/**
 * RequiresAction handler parametreleri
 */
export interface RequiresActionHandlerParams {
  orderId: string;
}

/**
 * Processing handler parametreleri
 */
export interface ProcessingHandlerParams {
  orderId: string;
}
