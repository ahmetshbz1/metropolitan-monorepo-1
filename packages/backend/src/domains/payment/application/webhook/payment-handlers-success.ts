// payment-handlers-success.ts
// Success payment handler implementation

import { RedisStockService } from "../../../../shared/infrastructure/cache/redis-stock.service";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import { WebhookOrderManagementService } from "./order-management.service";
import { PaymentIntentActionsService } from "./payment-intent-actions.service";
import { sendSuccessNotification } from "./payment-handlers-notification";
import type { WebhookProcessingResult } from "./payment-handlers-types";

/**
 * Redis'te reserved olan stock'ları confirm eder
 */
async function confirmRedisReservations(orderId: string): Promise<void> {
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
        logger.info(
          { productId: item.productId, quantity: item.quantity },
          "Redis reservation confirmed"
        );
      } catch (redisError) {
        logger.warn(
          {
            productId: item.productId,
            error: redisError instanceof Error ? redisError.message : String(redisError),
          },
          "Redis reservation confirmation failed"
        );
      }
    }
  } catch (error) {
    logger.error(
      {
        orderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Redis reservation confirmation error"
    );
  }
}

/**
 * Successful payment handler
 * Idempotency check, order completion, Redis confirmation, cart clearing, invoice generation
 */
export async function handleSuccess(
  orderId: string,
  userId: string,
  paymentIntentId: string
): Promise<WebhookProcessingResult> {
  // Check idempotency
  const idempotencyCheck = await WebhookOrderManagementService.checkOrderIdempotency(
    orderId,
    "completed"
  );

  if (!idempotencyCheck.shouldProcess) {
    logger.info(
      { orderId, reason: idempotencyCheck.reason },
      "Order already completed, skipping"
    );
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
  await confirmRedisReservations(orderId);

  // Clear user's cart
  await PaymentIntentActionsService.clearCartSafely(userId, orderId);

  // Send payment success push notification
  await sendSuccessNotification(orderId);

  // Generate invoice asynchronously
  PaymentIntentActionsService.generateInvoiceAsync(orderId, userId);

  return {
    success: true,
    message: `Payment succeeded for order ${orderId}`,
    orderId,
  };
}
