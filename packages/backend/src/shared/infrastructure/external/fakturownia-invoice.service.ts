// fakturownia-invoice.service.ts
// Invoice-specific operations for Fakturownia
// Create, retrieve, and download invoices

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
      console.log(`📝 Creating Fakturownia invoice for: ${invoice.buyer_name}`);
      
      const response = await this.apiClient.makeRequest<FakturowniaInvoiceResponse>(
        "invoices.json",
        {
          method: "POST",
          body: JSON.stringify({ invoice }),
        }
      );

      console.log(`✅ Fakturownia faturası oluşturuldu:`, {
        id: response.id,
        number: response.number,
        buyer: response.buyer_name,
        total: response.total_price_gross,
        status: response.status
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Fakturownia fatura oluşturma hatası:`, {
        buyer: invoice.buyer_name,
        positions: invoice.positions.length,
        error: error instanceof Error ? error.message : String(error)
      });
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
      console.error(`Fakturownia fatura getirme hatası (${invoiceId}):`, error);
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