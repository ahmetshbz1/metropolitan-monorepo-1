// payment-intent-actions.service.ts
// Side effects and async actions for payment processing

import { InvoiceService } from "../../../order/application/use-cases/invoice.service";

import { WebhookOrderManagementService } from "./order-management.service";

export class PaymentIntentActionsService {
  /**
   * Clear user's cart safely (non-blocking)
   */
  static async clearCartSafely(userId: string, orderId: string): Promise<void> {
    try {
      const cartResult = await WebhookOrderManagementService.clearUserCart(userId);
      console.log(cartResult.message);
    } catch (cartError) {
      console.error(`❌ Cart clearing failed for order ${orderId}:`, cartError);
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
        console.log(`📄 Generating invoice for order ${orderId}...`);
        await InvoiceService.generateInvoicePDF(orderId, userId);
        console.log(`✅ Invoice generated successfully for order ${orderId}`);
      } catch (invoiceError) {
        // Invoice errors don't affect payment success, just log them
        console.error(
          `❌ Invoice generation failed for order ${orderId}:`,
          invoiceError
        );
      }
    });
  }
}