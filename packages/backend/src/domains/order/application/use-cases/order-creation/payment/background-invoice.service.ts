//  "background-invoice.service.ts"
//  metropolitan backend
//  Service for background invoice generation

import { logger } from "../../../../../../shared/infrastructure/monitoring/logger.config";

export class BackgroundInvoiceService {
  /**
   * Schedule invoice generation in background
   * Non-blocking operation to improve order creation performance
   */
  static scheduleInvoiceGeneration(orderId: string, userId: string): void {
    // Async operation - doesn't block order creation
    setImmediate(async () => {
      try {
        logger.info({ orderId, context: "BackgroundInvoiceService" }, "Background fatura oluşturuluyor");
        const startTime = performance.now();

        // Generate invoice and cache it
        const { InvoiceService } = await import("../../invoice.service");
        await InvoiceService.generateInvoicePDF(orderId, userId);

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        logger.info(
          { orderId, duration, context: "BackgroundInvoiceService" },
          "Background fatura oluşturuldu"
        );
      } catch (error) {
        // Log error but don't affect order
        logger.error({ orderId, error, context: "BackgroundInvoiceService" }, "Background fatura oluşturma hatası");
      }
    });
  }
}