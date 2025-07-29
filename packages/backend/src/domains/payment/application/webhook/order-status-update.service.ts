// "order-status-update.service.ts"
// metropolitan backend  
// Core order status update operations

import { eq } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import { orders } from "../../../../shared/infrastructure/database/schema";
import type { OrderStatusUpdate, WebhookProcessingResult } from "./webhook-types";

export class OrderStatusUpdateService {
  
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
}