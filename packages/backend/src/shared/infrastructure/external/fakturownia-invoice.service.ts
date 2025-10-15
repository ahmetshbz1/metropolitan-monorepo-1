// fakturownia-invoice.service.ts
// Invoice-specific operations for Fakturownia
// Create, retrieve, and download invoices

import { logger } from "../monitoring/logger.config";
import { FakturowniaApiClientService } from "./fakturownia-api-client.service";
import type {
  FakturowniaInvoice,
  FakturowniaInvoiceResponse
} from "./fakturownia-types";

export class FakturowniaInvoiceService {
  private apiClient: FakturowniaApiClientService;

  constructor() {
    this.apiClient = new FakturowniaApiClientService();
  }

  /**
   * Create new invoice
   */
  async createInvoice(invoice: FakturowniaInvoice): Promise<FakturowniaInvoiceResponse> {
    try {
      logger.info({ buyerName: invoice.buyer_name }, "Fakturownia fatura oluşturuluyor");

      const response = await this.apiClient.makeRequest<FakturowniaInvoiceResponse>(
        "invoices.json",
        {
          method: "POST",
          body: JSON.stringify({ invoice }),
        }
      );

      logger.info(
        {
          invoiceId: response.id,
          invoiceNumber: response.number,
          buyerName: response.buyer_name,
          totalGross: response.total_price_gross,
          status: response.status
        },
        "Fakturownia faturası oluşturuldu"
      );

      return response;
    } catch (error) {
      logger.error(
        {
          buyerName: invoice.buyer_name,
          positionsCount: invoice.positions.length,
          error: error instanceof Error ? error.message : String(error)
        },
        "Fakturownia fatura oluşturma hatası"
      );
      throw error;
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: number): Promise<FakturowniaInvoiceResponse> {
    try {
      return await this.apiClient.makeRequest<FakturowniaInvoiceResponse>(
        `invoices/${invoiceId}.json`
      );
    } catch (error) {
      logger.error(
        { invoiceId, error: error instanceof Error ? error.message : String(error) },
        "Fakturownia fatura getirme hatası"
      );
      throw error;
    }
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoicePDF(invoiceId: number): Promise<Buffer> {
    return this.apiClient.downloadPDF(invoiceId);
  }
}