// payment-state-handlers.service.ts
// Individual handlers for each payment intent state

import { RedisStockService } from "../../../../shared/infrastructure/cache/redis-stock.service";
import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";

import { WebhookOrderManagementService } from "./order-management.service";
import { PaymentIntentActionsService } from "./payment-intent-actions.service";
import { WebhookStockRollbackService } from "./stock-rollback.service";
import type { WebhookProcessingResult } from "./webhook-types";

export class PaymentStateHandlersService {
  /**
   * Handle successful payment
   */
  static async handleSuccess(
    orderId: string, 
    userId: string, 
    paymentIntentId: string
  ): Promise<WebhookProcessingResult> {
    // Check idempotency
    const idempotencyCheck = await WebhookOrderManagementService.checkOrderIdempotency(
      orderId, 
      'completed'
    );

    if (!idempotencyCheck.shouldProcess) {
      console.log(`Order ${orderId} already completed, skipping...`);
      return {
        success: true,
        message: idempotencyCheck.reason,
        orderId,
      };
    }

    // Mark order as completed
    const orderUpdateResult = await WebhookOrderManagementService.markOrderCompleted(
      orderId,
      paymentIntentId
    );

    if (!orderUpdateResult.success) {
      return orderUpdateResult;
    }

    console.log(`✅ Order ${orderId} payment completed successfully`);

    // Confirm Redis reservations
    try {
      const { db } = await import("../../../../shared/infrastructure/database/connection");
      const { orderItems } = await import("../../../../shared/infrastructure/database/schema");
      const { eq } = await import("drizzle-orm");

      const items = await db
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        try {
          await RedisStockService.confirmReservation(item.productId, item.quantity);
          console.log(`✅ Redis reservation confirmed: ${item.productId} x ${item.quantity}`);
        } catch (redisError) {
          console.warn(`⚠️ Redis reservation confirmation failed for ${item.productId}:`, redisError);
        }
      }
    } catch (error) {
      console.error(`❌ Redis reservation confirmation error for order ${orderId}:`, error);
    }

    // Clear user's cart
    await PaymentIntentActionsService.clearCartSafely(userId, orderId);

    // Send payment success push notification
    try {
      const { db } = await import("../../../../shared/infrastructure/database/connection");
      const { orders } = await import("../../../../shared/infrastructure/database/schema");
      const { eq } = await import("drizzle-orm");

      const [order] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          orderNumber: orders.orderNumber,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (order) {
        // Send payment success notification
        await PushNotificationService.sendToUser(order.userId, {
          customTranslations: {
            tr: {
              title: "Ödeme Başarılı",
              body: `${order.orderNumber} numaralı siparişiniz için ödemeniz alındı. Siparişiniz hazırlanıyor.`,
            },
            en: {
              title: "Payment Successful",
              body: `Payment received for order ${order.orderNumber}. Your order is being prepared.`,
            },
            pl: {
              title: "Płatność Pomyślna",
              body: `Płatność otrzymana za zamówienie ${order.orderNumber}. Twoje zamówienie jest przygotowywane.`,
            },
          },
          type: "payment_success",
          data: {
            screen: `/order/${order.id}`,
            orderId: order.id,
            orderNumber: order.orderNumber,
            type: "payment_success",
          },
        });
        console.log(`📱 Payment success push sent for order ${order.orderNumber}`);
      }
    } catch (error) {
      console.error("Failed to send payment success notification:", error);
    }

    // Generate invoice asynchronously
    PaymentIntentActionsService.generateInvoiceAsync(orderId, userId);

    return {
      success: true,
      message: `Payment succeeded for order ${orderId}`,
      orderId,
    };
  }

  /**
   * Handle failed payment
   */
  static async handleFailure(orderId: string): Promise<WebhookProcessingResult> {
    // Mark order as failed
    const orderUpdateResult = await WebhookOrderManagementService.markOrderFailed(orderId);

    if (!orderUpdateResult.success) {
      return orderUpdateResult;
    }

    console.log(`❌ Order ${orderId} payment failed`);

    // Get order info for notification
    try {
      const { db } = await import("../../../../shared/infrastructure/database/connection");
      const { orders } = await import("../../../../shared/infrastructure/database/schema");
      const { eq } = await import("drizzle-orm");

      const [order] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          orderNumber: orders.orderNumber,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (order) {
        // Send payment failed notification
        await PushNotificationService.sendToUser(order.userId, {
          customTranslations: {
            tr: {
              title: "Ödeme Başarısız",
              body: `${order.orderNumber} numaralı siparişinizin ödemesi alınamadı. Lütfen tekrar deneyin.`,
            },
            en: {
              title: "Payment Failed",
              body: `Payment for order ${order.orderNumber} failed. Please try again.`,
            },
            pl: {
              title: "Płatność Nieudana",
              body: `Płatność za zamówienie ${order.orderNumber} nie powiodła się. Spróbuj ponownie.`,
            },
          },
          type: "payment_failed",
          data: {
            screen: `/cart`,
            orderId: order.id,
            orderNumber: order.orderNumber,
            type: "payment_failed",
          },
        });
      }
    } catch (error) {
      console.error("Failed to send payment failed notification:", error);
    }

    // Rollback stock
    const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);

    if (!rollbackResult.success) {
      console.error(`Stock rollback failed for order ${orderId}:`, rollbackResult.errors);
    }

    return {
      success: true,
      message: `Payment failed for order ${orderId}, stock rolled back`,
      orderId,
    };
  }

  /**
   * Handle payment requiring action
   */
  static async handleRequiresAction(orderId: string): Promise<WebhookProcessingResult> {
    const orderUpdateResult = await WebhookOrderManagementService.markOrderRequiresAction(orderId);

    if (!orderUpdateResult.success) {
      return orderUpdateResult;
    }

    console.log(`🔐 Order ${orderId} requires additional authentication`);

    return {
      success: true,
      message: `Order ${orderId} requires additional authentication`,
      orderId,
    };
  }

  /**
   * Handle canceled payment
   */
  static async handleCancellation(orderId: string): Promise<WebhookProcessingResult> {
    // Check idempotency
    const idempotencyCheck = await WebhookOrderManagementService.checkOrderIdempotency(
      orderId,
      'canceled'
    );

    if (!idempotencyCheck.shouldProcess) {
      console.log(`Order ${orderId} already canceled, skipping...`);
      return {
        success: true,
        message: idempotencyCheck.reason,
        orderId,
      };
    }

    // Mark order as canceled
    const orderUpdateResult = await WebhookOrderManagementService.markOrderCanceled(orderId);

    if (!orderUpdateResult.success) {
      return orderUpdateResult;
    }

    console.log(`🚫 Order ${orderId} payment canceled`);

    // Get order info for notification
    try {
      const { db } = await import("../../../../shared/infrastructure/database/connection");
      const { orders } = await import("../../../../shared/infrastructure/database/schema");
      const { eq } = await import("drizzle-orm");

      const [order] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          orderNumber: orders.orderNumber,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (order) {
        // Send payment canceled notification
        await PushNotificationService.sendToUser(order.userId, {
          customTranslations: {
            tr: {
              title: "Ödeme İptal Edildi",
              body: `${order.orderNumber} numaralı siparişinizin ödemesi iptal edildi.`,
            },
            en: {
              title: "Payment Cancelled",
              body: `Payment for order ${order.orderNumber} was cancelled.`,
            },
            pl: {
              title: "Płatność Anulowana",
              body: `Płatność za zamówienie ${order.orderNumber} została anulowana.`,
            },
          },
          type: "payment_canceled",
          data: {
            screen: `/cart`,
            orderId: order.id,
            orderNumber: order.orderNumber,
            type: "payment_canceled",
          },
        });
      }
    } catch (error) {
      console.error("Failed to send payment canceled notification:", error);
    }

    // Rollback stock
    const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);

    if (!rollbackResult.success) {
      console.error(`Stock rollback failed for canceled order ${orderId}:`, rollbackResult.errors);
    }

    return {
      success: true,
      message: `Payment canceled for order ${orderId}, stock rolled back`,
      orderId,
    };
  }

  /**
   * Handle processing payment
   */
  static async handleProcessing(orderId: string): Promise<WebhookProcessingResult> {
    const orderUpdateResult = await WebhookOrderManagementService.markOrderProcessing(orderId);

    if (!orderUpdateResult.success) {
      return orderUpdateResult;
    }

    console.log(`⏳ Order ${orderId} payment is processing`);

    return {
      success: true,
      message: `Order ${orderId} payment is processing`,
      orderId,
    };
  }
}