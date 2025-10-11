// fakturownia.service.ts
// Orchestrator service for Fakturownia integration
// Delegates to specialized services for better modularity

import { FakturowniaApiClientService } from "./fakturownia-api-client.service";
import { FakturowniaClientService } from "./fakturownia-client.service";
import { FakturowniaInvoiceService } from "./fakturownia-invoice.service";
import { FakturowniaProductService } from "./fakturownia-product.service";
import type {
  FakturowniaInvoice,
  FakturowniaInvoiceResponse,
  FakturowniaClient,
  FakturowniaProduct
} from "./fakturownia-types";

// Re-export types for backward compatibility
export * from "./fakturownia-types";

class FakturowniaService {
  private apiClient: FakturowniaApiClientService;
  private invoiceService: FakturowniaInvoiceService;
  private clientService: FakturowniaClientService;
  private productService: FakturowniaProductService;

  constructor() {
    this.apiClient = new FakturowniaApiClientService();
    this.invoiceService = new FakturowniaInvoiceService();
    this.clientService = new FakturowniaClientService();
    this.productService = new FakturowniaProductService();
  }

  // Invoice operations
  async createInvoice(invoice: FakturowniaInvoice): Promise<FakturowniaInvoiceResponse> {
    return this.invoiceService.createInvoice(invoice);
  }

  async getInvoice(invoiceId: number): Promise<FakturowniaInvoiceResponse> {
    return this.invoiceService.getInvoice(invoiceId);
  }

  async downloadInvoicePDF(invoiceId: number): Promise<Buffer> {
    return this.invoiceService.downloadInvoicePDF(invoiceId);
  }

  // Client operations
  async createClient(client: FakturowniaClient): Promise<{ id: number; name: string; tax_no?: string }> {
    return this.clientService.createClient(client);
  }

  async getClients(): Promise<Array<{ id: number; name: string; tax_no?: string }>> {
    return this.clientService.getClients();
  }

  // Product operations
  async listProducts(): Promise<FakturowniaProduct[]> {
    return this.productService.listProducts();
  }

  async searchProductByCode(code: string): Promise<FakturowniaProduct | null> {
    return this.productService.searchProductByCode(code);
  }

  async getProduct(productId: number): Promise<FakturowniaProduct> {
    return this.productService.getProduct(productId);
  }

  // Connection test
  async testConnection(): Promise<boolean> {
    try {
      await this.apiClient.makeRequest<any>("invoices.json");
      return true;
    } catch (error) {
      console.error("Fakturownia bağlantı testi başarısız:", error);
      return false;
    }
  }
}

export const fakturowniaService = new FakturowniaService();