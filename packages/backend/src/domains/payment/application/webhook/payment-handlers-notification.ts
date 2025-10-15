// payment-handlers-notification.ts
// Push notification functions for payment state changes

import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import { fetchOrderForNotification } from "./payment-handlers-order-fetcher";
import type { OrderInfo } from "./payment-handlers-types";

/**
 * Payment success notification gönderir
 */
export async function sendSuccessNotification(orderId: string): Promise<void> {
  try {
    const order = await fetchOrderForNotification(orderId);

    if (!order) {
      logger.warn({ orderId }, "Order not found for success notification");
      return;
    }

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

    logger.info(
      { orderId: order.id, orderNumber: order.orderNumber },
      "Payment success push notification sent"
    );
  } catch (error) {
    logger.error(
      {
        orderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Failed to send payment success notification"
    );
  }
}

/**
 * Payment failure notification gönderir
 */
export async function sendFailureNotification(orderId: string): Promise<void> {
  try {
    const order = await fetchOrderForNotification(orderId);

    if (!order) {
      logger.warn({ orderId }, "Order not found for failure notification");
      return;
    }

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

    logger.info(
      { orderId: order.id, orderNumber: order.orderNumber },
      "Payment failure push notification sent"
    );
  } catch (error) {
    logger.error(
      {
        orderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Failed to send payment failed notification"
    );
  }
}

/**
 * Payment cancellation notification gönderir
 */
export async function sendCancellationNotification(orderId: string): Promise<void> {
  try {
    const order = await fetchOrderForNotification(orderId);

    if (!order) {
      logger.warn({ orderId }, "Order not found for cancellation notification");
      return;
    }

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

    logger.info(
      { orderId: order.id, orderNumber: order.orderNumber },
      "Payment cancellation push notification sent"
    );
  } catch (error) {
    logger.error(
      {
        orderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Failed to send payment canceled notification"
    );
  }
}
