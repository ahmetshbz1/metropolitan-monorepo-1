// invoice.service.ts
// Orchestrator service for invoice generation and management

import type { InvoiceData } from "@metropolitan/shared/types/order";

import { InvoiceCacheService } from "./invoice-cache.service";
import { InvoiceDataService } from "./invoice-data.service";
import { InvoiceFileService } from "./invoice-file.service";
import { PDFService } from "./pdf.service";

export class InvoiceService {
  /**
   * Get invoice data for an order
   */
  static async getInvoiceData(
    orderId: string,
    userId: string
  ): Promise<InvoiceData> {
    return InvoiceDataService.getInvoiceData(orderId, userId);
  }

  /**
   * Generate invoice PDF (with cache and file system)
   */
  static async generateInvoicePDF(
    orderId: string,
    userId: string
  ): Promise<Buffer> {
    // Check cache first
    const cachedPDF = await InvoiceCacheService.getCachedPDF(orderId);
    if (cachedPDF) {
      console.log(`Fatura cache'den geldi: ${orderId}`);
      return cachedPDF;
    }

    // Check file system if not in cache
    if (await InvoiceFileService.pdfExists(orderId, userId)) {
      console.log(`Fatura file system'den geldi: ${orderId}`);
      const pdfBuffer = await InvoiceFileService.readPdf(orderId, userId);

      // Cache the PDF retrieved from file system
      await InvoiceCacheService.cachePDF(orderId, pdfBuffer);

      return pdfBuffer;
    }

    // Generate new PDF if not found anywhere
    console.log(`Fatura oluşturuluyor: ${orderId}`);
    const invoiceData = await this.getInvoiceData(orderId, userId);
    const pdfBuffer = await PDFService.generateInvoicePDF(invoiceData, orderId);

    // Save to file system
    await InvoiceFileService.savePdf(orderId, pdfBuffer, userId);

    // Cache the generated PDF
    await InvoiceCacheService.cachePDF(orderId, pdfBuffer);

    return pdfBuffer;
  }

  /**
   * Invalidate invoice cache and delete files
   */
  static async invalidateInvoice(orderId: string): Promise<void> {
    // Clear cache
    await InvoiceCacheService.clearInvoiceAndFakturowniaCache(orderId);

    // Get order info for userId
    const orderInfo = await InvoiceFileService.getOrderFileInfo(orderId);

    if (orderInfo) {
      // Delete PDF files
      await InvoiceFileService.deletePdf(orderId, orderInfo.userId);
    }

    // Clear database paths
    await InvoiceFileService.clearPdfPath(orderId);
  }

  /**
   * Backward compatibility method
   */
  static async invalidateInvoiceCache(orderId: string): Promise<void> {
    await this.invalidateInvoice(orderId);
  }
}
