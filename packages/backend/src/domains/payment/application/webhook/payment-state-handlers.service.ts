// payment-state-handlers.service.ts
// Individual handlers for each payment intent state

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import { WebhookOrderManagementService } from "./order-management.service";
import { handleSuccess } from "./payment-handlers-success";
import { handleFailure, handleCancellation } from "./payment-handlers-failure-cancel";
import type { WebhookProcessingResult } from "./payment-handlers-types";

export class PaymentStateHandlersService {
  /**
   * Handle successful payment
   */
  static async handleSuccess(
    orderId: string,
    userId: string,
    paymentIntentId: string
  ): Promise<WebhookProcessingResult> {
    return handleSuccess(orderId, userId, paymentIntentId);
  }

  /**
   * Handle failed payment
   */
  static async handleFailure(orderId: string): Promise<WebhookProcessingResult> {
    return handleFailure(orderId);
  }

  /**
   * Handle payment requiring action
   */
  static async handleRequiresAction(orderId: string): Promise<WebhookProcessingResult> {
    const orderUpdateResult = await WebhookOrderManagementService.markOrderRequiresAction(
      orderId
    );

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
    return handleCancellation(orderId);
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
