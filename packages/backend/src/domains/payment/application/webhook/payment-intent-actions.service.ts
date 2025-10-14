// payment-intent-actions.service.ts
// Side effects and async actions for payment processing

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { InvoiceService } from "../../../order/application/use-cases/invoice.service";

import { WebhookOrderManagementService } from "./order-management.service";

export class PaymentIntentActionsService {
  /**
   * Clear user's cart safely (non-blocking)
   */
  static async clearCartSafely(userId: string, orderId: string): Promise<void> {
    try {
      const cartResult = await WebhookOrderManagementService.clearUserCart(userId);
      logger.info({ userId, orderId, message: cartResult.message }, "Cart cleared successfully");
    } catch (cartError) {
      logger.error({
        userId,
        orderId,
        error: cartError instanceof Error ? cartError.message : String(cartError),
        stack: cartError instanceof Error ? cartError.stack : undefined
      }, "Cart clearing failed for order");
      // Don't fail the webhook for cart clearing issues
    }
  }

  /**
   * Generate invoice asynchronously (non-blocking)
   */
  static generateInvoiceAsync(orderId: string, userId: string): void {
    // Run in background without blocking webhook response
    Promise.resolve().then(async () => {
      try {
        logger.info({ orderId, userId }, "Generating invoice for order");
        await InvoiceService.generateInvoicePDF(orderId, userId);
        logger.info({ orderId, userId }, "Invoice generated successfully");
      } catch (invoiceError) {
        // Invoice errors don't affect payment success, just log them
        logger.error({
          orderId,
          userId,
          error: invoiceError instanceof Error ? invoiceError.message : String(invoiceError),
          stack: invoiceError instanceof Error ? invoiceError.stack : undefined
        }, "Invoice generation failed for order");
      }
    });
  }
}