// payment-handlers-failure-cancel.ts
// Failure and cancellation payment handlers

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import { WebhookOrderManagementService } from "./order-management.service";
import { WebhookStockRollbackService } from "./stock-rollback.service";
import {
  sendFailureNotification,
  sendCancellationNotification,
} from "./payment-handlers-notification";
import type { WebhookProcessingResult } from "./payment-handlers-types";

/**
 * Stock rollback yapar ve sonucu loglar
 */
async function rollbackStockWithLogging(orderId: string, context: string): Promise<void> {
  const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);

  if (!rollbackResult.success) {
    logger.error(
      { orderId, errors: rollbackResult.errors },
      `Stock rollback failed for ${context}`
    );
  }
}

/**
 * Failed payment handler
 * Order'ı failed olarak işaretle, notification gönder, stock rollback yap
 */
export async function handleFailure(orderId: string): Promise<WebhookProcessingResult> {
  // Mark order as failed
  const orderUpdateResult = await WebhookOrderManagementService.markOrderFailed(orderId);

  if (!orderUpdateResult.success) {
    return orderUpdateResult;
  }

  logger.warn({ orderId }, "Order payment failed");

  // Send payment failed notification
  await sendFailureNotification(orderId);

  // Rollback stock
  await rollbackStockWithLogging(orderId, "failed order");

  return {
    success: true,
    message: `Payment failed for order ${orderId}, stock rolled back`,
    orderId,
  };
}

/**
 * Canceled payment handler
 * Idempotency check, order'ı canceled olarak işaretle, notification gönder, stock rollback yap
 */
export async function handleCancellation(orderId: string): Promise<WebhookProcessingResult> {
  // Check idempotency
  const idempotencyCheck = await WebhookOrderManagementService.checkOrderIdempotency(
    orderId,
    "canceled"
  );

  if (!idempotencyCheck.shouldProcess) {
    logger.info(
      { orderId, reason: idempotencyCheck.reason },
      "Order already canceled, skipping"
    );
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

  // Send payment canceled notification
  await sendCancellationNotification(orderId);

  // Rollback stock
  await rollbackStockWithLogging(orderId, "canceled order");

  return {
    success: true,
    message: `Payment canceled for order ${orderId}, stock rolled back`,
    orderId,
  };
}
