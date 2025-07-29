// "order-status-handlers.service.ts"
// metropolitan backend  
// Status-specific handler methods for orders

import type { OrderStatusUpdate, WebhookProcessingResult } from "./webhook-types";
import { OrderStatusUpdateService } from "./order-status-update.service";

export class OrderStatusHandlersService {
  
  /**
   * Mark order as completed with payment success
   */
  static async markOrderCompleted(
    orderId: string,
    stripePaymentIntentId: string
  ): Promise<WebhookProcessingResult> {
    const statusUpdate: OrderStatusUpdate = {
      paymentStatus: 'completed',
      status: 'confirmed',
      paidAt: new Date(),
      updatedAt: new Date(),
    };

    return OrderStatusUpdateService.updateOrderStatus(orderId, statusUpdate);
  }

  /**
   * Mark order as failed
   */
  static async markOrderFailed(orderId: string): Promise<WebhookProcessingResult> {
    const statusUpdate: OrderStatusUpdate = {
      paymentStatus: 'failed',
      status: 'canceled',
      updatedAt: new Date(),
    };

    return OrderStatusUpdateService.updateOrderStatus(orderId, statusUpdate);
  }

  /**
   * Mark order as canceled by customer
   */
  static async markOrderCanceled(orderId: string): Promise<WebhookProcessingResult> {
    const statusUpdate: OrderStatusUpdate = {
      paymentStatus: 'canceled',
      status: 'canceled',
      cancelledAt: new Date(),
      cancelReason: 'Payment canceled by customer',
      updatedAt: new Date(),
    };

    return OrderStatusUpdateService.updateOrderStatus(orderId, statusUpdate);
  }

  /**
   * Mark order as requiring additional action
   */
  static async markOrderRequiresAction(orderId: string): Promise<WebhookProcessingResult> {
    const statusUpdate: OrderStatusUpdate = {
      paymentStatus: 'requires_action',
      status: 'pending',
      updatedAt: new Date(),
    };

    return OrderStatusUpdateService.updateOrderStatus(orderId, statusUpdate);
  }

  /**
   * Mark order as processing
   */
  static async markOrderProcessing(orderId: string): Promise<WebhookProcessingResult> {
    const statusUpdate: OrderStatusUpdate = {
      paymentStatus: 'processing',
      status: 'processing',
      updatedAt: new Date(),
    };

    return OrderStatusUpdateService.updateOrderStatus(orderId, statusUpdate);
  }
}