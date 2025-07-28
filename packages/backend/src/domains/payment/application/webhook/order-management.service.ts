//  "order-management.service.ts"
//  metropolitan backend  
//  Focused service for webhook-triggered order status management
//  Extracted from stripe-webhook.routes.ts (order update logic)

import { eq } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import { orders, cartItems, orderItems } from "../../../../shared/infrastructure/database/schema";
import type { OrderStatusUpdate, WebhookProcessingResult } from "./webhook-types";

export class WebhookOrderManagementService {

  /**
   * Update order status based on payment intent
   */
  static async updateOrderStatus(
    orderId: string,
    statusUpdate: OrderStatusUpdate
  ): Promise<WebhookProcessingResult> {
    try {
      await db
        .update(orders)
        .set({
          ...statusUpdate,
          stripePaymentIntentId: statusUpdate.paymentStatus === 'completed' ? orderId : undefined,
        })
        .where(eq(orders.id, orderId));

      return {
        success: true,
        message: `Order ${orderId} status updated to ${statusUpdate.paymentStatus}`,
        orderId,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update order ${orderId}`,
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if order already has the expected status (for idempotency)
   */
  static async checkOrderIdempotency(
    orderId: string,
    expectedPaymentStatus: string
  ): Promise<{
    shouldProcess: boolean;
    currentStatus?: string;
    reason: string;
  }> {
    try {
      const existingOrder = await db
        .select({ 
          paymentStatus: orders.paymentStatus, 
          status: orders.status 
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (existingOrder.length === 0) {
        return {
          shouldProcess: false,
          reason: `Order ${orderId} not found`,
        };
      }

      const currentStatus = existingOrder[0].paymentStatus;
      
      if (currentStatus === expectedPaymentStatus) {
        return {
          shouldProcess: false,
          currentStatus,
          reason: `Order ${orderId} already has status ${expectedPaymentStatus}`,
        };
      }

      return {
        shouldProcess: true,
        currentStatus,
        reason: `Order ${orderId} status update needed: ${currentStatus} → ${expectedPaymentStatus}`,
      };
    } catch (error) {
      return {
        shouldProcess: false,
        reason: `Error checking order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Clear user's cart after successful payment
   */
  static async clearUserCart(userId: string): Promise<{
    success: boolean;
    itemsCleared: number;
    message: string;
  }> {
    try {
      return await db.transaction(async (tx) => {
        // Check if cart still has items
        const remainingCartItems = await tx
          .select({ id: cartItems.id })
          .from(cartItems)
          .where(eq(cartItems.userId, userId));

        if (remainingCartItems.length === 0) {
          return {
            success: true,
            itemsCleared: 0,
            message: `Cart already cleared for user ${userId}`,
          };
        }

        // Clear cart
        await tx.delete(cartItems).where(eq(cartItems.userId, userId));
        
        return {
          success: true,
          itemsCleared: remainingCartItems.length,
          message: `Cart cleared for user ${userId}, ${remainingCartItems.length} items removed`,
        };
      });
    } catch (error) {
      return {
        success: false,
        itemsCleared: 0,
        message: `Failed to clear cart for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get order details for stock rollback operations
   */
  static async getOrderDetailsForRollback(orderId: string): Promise<{
    success: boolean;
    orderDetails: Array<{
      userId: string;
      productId: string;
      quantity: number;
    }>;
    error?: string;
  }> {
    try {
      const orderDetails = await db
        .select({
          userId: orders.userId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orders.id, orderId));

      const validDetails = orderDetails
        .filter(detail => detail.productId && detail.quantity)
        .map(detail => ({
          userId: detail.userId,
          productId: detail.productId!,
          quantity: detail.quantity!,
        }));

      return {
        success: true,
        orderDetails: validDetails,
      };
    } catch (error) {
      return {
        success: false,
        orderDetails: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get order basic information from payment intent metadata
   */
  static extractOrderInfo(metadata: any): {
    orderId?: string;
    userId?: string;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!metadata.order_id) {
      errors.push('Order ID not found in payment intent metadata');
    }
    
    if (!metadata.user_id) {
      errors.push('User ID not found in payment intent metadata');
    }

    return {
      orderId: metadata.order_id,
      userId: metadata.user_id,
      isValid: errors.length === 0,
      errors,
    };
  }

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

    return this.updateOrderStatus(orderId, statusUpdate);
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

    return this.updateOrderStatus(orderId, statusUpdate);
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

    return this.updateOrderStatus(orderId, statusUpdate);
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

    return this.updateOrderStatus(orderId, statusUpdate);
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

    return this.updateOrderStatus(orderId, statusUpdate);
  }
}