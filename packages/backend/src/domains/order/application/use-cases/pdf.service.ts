//  "pdf.service.ts"
//  metropolitan backend
//  Created by Ahmet on 02.06.2025.
//  Updated by Ahmet on 20.07.2025. - Fakturownia API entegrasyonu

import type { InvoiceData } from "@metropolitan/shared/types/order";

import { fakturowniaService } from "../../../../shared/infrastructure/external/fakturownia.service";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import { FakturowniaAdapterService } from "./fakturownia-adapter.service";
import { InvoiceCacheService } from "./invoice-cache.service";

export class PDFService {
  /**
   * Fakturownia API ile fatura PDF'i oluşturur
   * Python/WeasyPrint artık kullanılmıyor
   */
  static async generateInvoicePDF(data: InvoiceData, orderId?: string): Promise<Buffer> {
    try {
      logger.info({ orderNumber: data.orderNumber, context: "PDFService" }, "Fakturownia ile fatura oluşturuluyor");

      // 1. Cache'den Fakturownia ID'sini kontrol et (eğer orderId varsa)
      let fakturowniaId: number | null = null;
      if (orderId) {
        fakturowniaId = await InvoiceCacheService.getCachedFakturowniaId(orderId);
        if (fakturowniaId) {
          logger.info({ fakturowniaId, context: "PDFService" }, "Cache'den Fakturownia ID bulundu");
          try {
            // Direkt PDF'i indir
            const pdfBuffer = await fakturowniaService.downloadInvoicePDF(fakturowniaId);
            logger.info({ fakturowniaId, context: "PDFService" }, "Fakturownia PDF cache'den indirildi");
            return pdfBuffer;
          } catch (error) {
            logger.warn({ error, context: "PDFService" }, "Cache'deki Fakturownia ID geçersiz, yeni fatura oluşturulacak");
            // Cache'i temizle ve yeni fatura oluştur
            await InvoiceCacheService.clearInvoiceAndFakturowniaCache(orderId);
          }
        }
      }

      // 2. Validation
      const validation = FakturowniaAdapterService.validateForFakturownia(data);
      if (!validation.isValid) {
        throw new Error(`Fatura validation hatası: ${validation.errors.join(", ")}`);
      }

      // 3. InvoiceData'yı Fakturownia formatına çevir
      const fakturowniaInvoice = FakturowniaAdapterService.convertToFakturowniaFormat(data);

      // 4. Fakturownia'da fatura oluştur
      const createdInvoice = await fakturowniaService.createInvoice(fakturowniaInvoice);
      logger.info({ invoiceNumber: createdInvoice.number, invoiceId: createdInvoice.id, context: "PDFService" }, "Fakturownia faturası oluşturuldu");

      // 5. Fakturownia ID'sini cache'le
      if (orderId) {
        await InvoiceCacheService.cacheFakturowniaId(orderId, createdInvoice.id);
      }

      // 6. PDF'i Fakturownia'dan indir
      const pdfBuffer = await fakturowniaService.downloadInvoicePDF(createdInvoice.id);
      logger.info({ invoiceNumber: createdInvoice.number, context: "PDFService" }, "Fakturownia PDF indirildi");

      return pdfBuffer;
    } catch (error) {
      logger.error({ error, context: "PDFService" }, "Fakturownia PDF Generation Error");

      // Fallback: Eğer Fakturownia başarısız olursa, eski sistemi kullan
      if (process.env.NODE_ENV === "development") {
        logger.warn({ context: "PDFService" }, "Fakturownia hatası, WeasyPrint fallback kullanılıyor");
        return this.generateInvoicePDFLegacy(data);
      }
      
      throw new Error(
        `Fakturownia fatura oluşturma hatası: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Legacy WeasyPrint sistemi (sadece fallback için)
   * Production'da kullanılmaz
   */
  private static async generateInvoicePDFLegacy(data: InvoiceData): Promise<Buffer> {
    try {
      logger.warn({ context: "PDFService" }, "LEGACY: WeasyPrint kullanılıyor (sadece fallback)");

      // Python script path
      const scriptPath = "scripts/weasyprint-pdf.py";

      // Python process spawn et
      const pythonProcess = Bun.spawn(["python3", scriptPath], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      });

      // JSON data'yı stdin'e yaz
      const jsonData = JSON.stringify(data);
      await pythonProcess.stdin.write(jsonData);
      await pythonProcess.stdin.end();

      // Process'in bitmesini bekle
      const exitCode = await pythonProcess.exited;

      if (exitCode !== 0) {
        // Error handling
        const stderr = await new Response(pythonProcess.stderr).text();
        throw new Error(`Legacy PDF generation failed: ${stderr}`);
      }

      // PDF buffer'ı al
      const pdfBuffer = await new Response(pythonProcess.stdout).arrayBuffer();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error({ error, context: "PDFService" }, "Legacy PDF Generation Error");
      throw new Error(
        `Legacy PDF oluşturma hatası: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Metropolitan Food Group şirket bilgilerini döner
   * KRS: 0000317933, NIP: 7292645203
   */
  static getCompanyInfo() {
    return {
      name: "METROPOLITAN FOOD GROUP SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ",
      address: "ul. LEONIDASA 57/PAW.502",
      city: "WARSZAWA",
      postalCode: "02-239",
      country: "POLSKA",
      nip: "7292645203",
      phone: "+48 22 123 45 67",
      email: "info@metropolitan-food.pl",
    };
  }
}
