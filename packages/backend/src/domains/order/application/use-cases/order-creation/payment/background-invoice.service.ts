//  "background-invoice.service.ts"
//  metropolitan backend
//  Service for background invoice generation

export class BackgroundInvoiceService {
  /**
   * Schedule invoice generation in background
   * Non-blocking operation to improve order creation performance
   */
  static scheduleInvoiceGeneration(orderId: string, userId: string): void {
    // Async operation - doesn't block order creation
    setImmediate(async () => {
      try {
        console.log(`Background fatura oluşturuluyor: ${orderId}`);
        const startTime = performance.now();

        // Generate invoice and cache it
        const { InvoiceService } = await import("../../invoice.service");
        await InvoiceService.generateInvoicePDF(orderId, userId);

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console.log(
          `Background fatura oluşturuldu: ${orderId} (${duration}ms)`
        );
      } catch (error) {
        // Log error but don't affect order
        console.error(`Background fatura oluşturma hatası: ${orderId}`, error);
      }
    });
  }
}