// payment-state-handlers.service.ts
// Individual handlers for each payment intent state

import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";
import { RedisStockService } from "../../../../shared/infrastructure/cache/redis-stock.service";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

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
      logger.info({ orderId, reason: idempotencyCheck.reason }, "Order already completed, skipping");
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

    logger.info({ orderId, paymentIntentId }, "Order payment completed successfully");

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
          logger.info({ productId: item.productId, quantity: item.quantity }, "Redis reservation confirmed");
        } catch (redisError) {
          logger.warn({ productId: item.productId, error: redisError instanceof Error ? redisError.message : String(redisError) }, "Redis reservation confirmation failed");
        }
      }
    } catch (error) {
      logger.error({ orderId, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Redis reservation confirmation error");
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
        logger.info({ orderId: order.id, orderNumber: order.orderNumber }, "Payment success push notification sent");
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Failed to send payment success notification");
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

    logger.warn({ orderId }, "Order payment failed");

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
      logger.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Failed to send payment failed notification");
    }

    // Rollback stock
    const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);

    if (!rollbackResult.success) {
      logger.error({ orderId, errors: rollbackResult.errors }, "Stock rollback failed for order");
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

    logger.info({ orderId }, "Order requires additional authentication");

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
      logger.info({ orderId, reason: idempotencyCheck.reason }, "Order already canceled, skipping");
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

    logger.warn({ orderId }, "Order payment canceled");

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
      logger.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, "Failed to send payment canceled notification");
    }

    // Rollback stock
    const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);

    if (!rollbackResult.success) {
      logger.error({ orderId, errors: rollbackResult.errors }, "Stock rollback failed for canceled order");
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

    logger.info({ orderId }, "Order payment is processing");

    return {
      success: true,
      message: `Order ${orderId} payment is processing`,
      orderId,
    };
  }
}