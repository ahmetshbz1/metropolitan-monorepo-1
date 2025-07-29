//  "order-management.service.ts"
//  metropolitan backend  
//  Coordinator service for webhook-triggered order management
//  Refactored to use modular services

import type { WebhookProcessingResult } from "./webhook-types";
import { OrderStatusUpdateService } from "./order-status-update.service";
import { OrderStatusHandlersService } from "./order-status-handlers.service";
import { OrderCartOperationsService } from "./order-cart-operations.service";

/**
 * Webhook Order Management Coordinator
 * Provides unified interface for all order-related webhook operations
 */
export class WebhookOrderManagementService {

  // ========== Status Update Operations ==========
  
  /**
   * Update order status based on payment intent
   */
  static async updateOrderStatus(
    orderId: string,
    statusUpdate: any
  ): Promise<WebhookProcessingResult> {
    return OrderStatusUpdateService.updateOrderStatus(orderId, statusUpdate);
  }

  /**
   * Check if order already has the expected status (for idempotency)
   */
  static async checkOrderIdempotency(
    orderId: string,
    expectedPaymentStatus: string
  ) {
    return OrderStatusUpdateService.checkOrderIdempotency(orderId, expectedPaymentStatus);
  }

  // ========== Cart Operations ==========
  
  /**
   * Clear user's cart after successful payment
   */
  static async clearUserCart(userId: string) {
    return OrderCartOperationsService.clearUserCart(userId);
  }

  /**
   * Get order details for stock rollback operations
   */
  static async getOrderDetailsForRollback(orderId: string) {
    return OrderCartOperationsService.getOrderDetailsForRollback(orderId);
  }

  /**
   * Get order basic information from payment intent metadata
   */
  static extractOrderInfo(metadata: any) {
    return OrderCartOperationsService.extractOrderInfo(metadata);
  }

  // ========== Status Handler Operations ==========
  
  /**
   * Mark order as completed with payment success
   */
  static async markOrderCompleted(
    orderId: string,
    stripePaymentIntentId: string
  ): Promise<WebhookProcessingResult> {
    return OrderStatusHandlersService.markOrderCompleted(orderId, stripePaymentIntentId);
  }

  /**
   * Mark order as failed
   */
  static async markOrderFailed(orderId: string): Promise<WebhookProcessingResult> {
    return OrderStatusHandlersService.markOrderFailed(orderId);
  }

  /**
   * Mark order as canceled by customer
   */
  static async markOrderCanceled(orderId: string): Promise<WebhookProcessingResult> {
    return OrderStatusHandlersService.markOrderCanceled(orderId);
  }

  /**
   * Mark order as requiring additional action
   */
  static async markOrderRequiresAction(orderId: string): Promise<WebhookProcessingResult> {
    return OrderStatusHandlersService.markOrderRequiresAction(orderId);
  }

  /**
   * Mark order as processing
   */
  static async markOrderProcessing(orderId: string): Promise<WebhookProcessingResult> {
    return OrderStatusHandlersService.markOrderProcessing(orderId);
  }

  // ========== Convenience Methods ==========

  /**
   * Process order based on payment status
   */
  static async processOrderByStatus(
    orderId: string, 
    paymentStatus: string,
    stripePaymentIntentId?: string
  ): Promise<WebhookProcessingResult> {
    switch (paymentStatus) {
      case 'succeeded':
        return this.markOrderCompleted(orderId, stripePaymentIntentId!);
      case 'payment_failed':
        return this.markOrderFailed(orderId);
      case 'canceled':
        return this.markOrderCanceled(orderId);
      case 'requires_action':
        return this.markOrderRequiresAction(orderId);
      case 'processing':
        return this.markOrderProcessing(orderId);
      default:
        return {
          success: false,
          message: `Unknown payment status: ${paymentStatus}`,
          orderId,
        };
    }
  }
}