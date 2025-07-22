//  "fakturownia.service.ts"
//  metropolitan backend
//  Created by Ahmet on 20.07.2025.

export interface FakturowniaInvoiceItem {
  name: string;
  tax: number;
  total_price_gross: number;
  quantity: number;
  kind?: string;
}

export interface FakturowniaInvoice {
  kind: "vat" | "proforma";
  sell_date: string;
  buyer_name: string;
  buyer_street?: string;
  buyer_city?: string;
  buyer_post_code?: string;
  buyer_country?: string;
  buyer_tax_no?: string;
  buyer_email?: string;
  buyer_phone?: string;
  payment_type?: string;
  payment_to?: string;
  positions: FakturowniaInvoiceItem[];
}

export interface FakturowniaInvoiceResponse {
  id: number;
  token: string;
  number: string;
  sell_date: string;
  total_price_gross: string;
  status: string;
  buyer_name: string;
  positions: FakturowniaInvoiceItem[];
}

export interface FakturowniaError {
  error: string;
  message?: string;
  errors?: Record<string, string[]>;
}

class FakturowniaService {
  private apiToken: string;
  private apiUrl: string;

  constructor() {
    this.apiToken = process.env.FAKTUROWNIA_API_TOKEN!;
    this.apiUrl = process.env.FAKTUROWNIA_API_URL!;

    if (!this.apiToken || !this.apiUrl) {
      throw new Error("Fakturownia API token veya URL bulunamadı");
    }
  }

  /**
   * API base URL'ini oluşturur
   */
  private getApiUrl(endpoint: string): string {
    return `${this.apiUrl}/${endpoint}?api_token=${this.apiToken}`;
  }

  /**
   * HTTP request wrapper with enhanced error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.getApiUrl(endpoint);
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Fakturownia API Request: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
        ...options,
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ Fakturownia API Response: ${response.status} in ${duration}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: FakturowniaError;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }

        // Enhanced error logging
        console.error(`❌ Fakturownia API Error:`, {
          endpoint,
          method: options.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          errorData,
          duration
        });

        // Specific error types
        if (response.status === 401) {
          throw new Error("Fakturownia API: Unauthorized - API token geçersiz");
        } else if (response.status === 404) {
          throw new Error("Fakturownia API: Resource not found");
        } else if (response.status === 429) {
          throw new Error("Fakturownia API: Rate limit exceeded");
        } else if (response.status >= 500) {
          throw new Error("Fakturownia API: Server error - Lütfen daha sonra tekrar deneyin");
        }

        throw new Error(
          `Fakturownia API Hatası (${response.status}): ${errorData.error || errorData.message || "Bilinmeyen hata"}`
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof Error && error.message.includes("Fakturownia API")) {
        // Re-throw our custom errors
        throw error;
      }
      
      // Network or other errors
      console.error(`🔥 Fakturownia Network Error:`, {
        endpoint,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new Error(`Fakturownia bağlantı hatası: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Yeni fatura oluşturur
   */
  async createInvoice(invoice: FakturowniaInvoice): Promise<FakturowniaInvoiceResponse> {
    try {
      console.log(`📝 Creating Fakturownia invoice for: ${invoice.buyer_name}`);
      
      const response = await this.makeRequest<FakturowniaInvoiceResponse>(
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
   * Fatura detaylarını getirir
   */
  async getInvoice(invoiceId: number): Promise<FakturowniaInvoiceResponse> {
    try {
      return await this.makeRequest<FakturowniaInvoiceResponse>(`invoices/${invoiceId}.json`);
    } catch (error) {
      console.error(`Fakturownia fatura getirme hatası (${invoiceId}):`, error);
      throw error;
    }
  }

  /**
   * Fatura PDF'ini indirir
   */
  async downloadInvoicePDF(invoiceId: number): Promise<Buffer> {
    const startTime = Date.now();
    
    try {
      console.log(`📥 Downloading PDF for Fakturownia invoice: ${invoiceId}`);
      
      const url = this.getApiUrl(`invoices/${invoiceId}.pdf`);
      
      const response = await fetch(url, {
        headers: {
          Accept: "application/pdf",
        },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        console.error(`❌ Fakturownia PDF download failed:`, {
          invoiceId,
          status: response.status,
          statusText: response.statusText,
          duration
        });
        
        if (response.status === 404) {
          throw new Error(`Fakturownia faturası bulunamadı: ${invoiceId}`);
        } else if (response.status === 401) {
          throw new Error("Fakturownia PDF indirme yetkisi yok");
        }
        
        throw new Error(`PDF indirme hatası: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const sizeKB = Math.round(buffer.length / 1024);

      console.log(`✅ Fakturownia PDF indirildi:`, {
        invoiceId,
        sizeKB: `${sizeKB} KB`,
        duration: `${duration}ms`
      });
      
      return buffer;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Fakturownia PDF indirme hatası:`, {
        invoiceId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      throw error;
    }
  }

  /**
   * Müşteri oluşturur
   */
  async createClient(client: {
    name: string;
    street?: string;
    city?: string;
    post_code?: string;
    country?: string;
    tax_no?: string;
    email?: string;
    phone?: string;
  }): Promise<{ id: number; name: string; tax_no?: string }> {
    try {
      const response = await this.makeRequest<{ id: number; name: string; tax_no?: string }>(
        "clients.json",
        {
          method: "POST",
          body: JSON.stringify({ client }),
        }
      );

      console.log(`Fakturownia müşterisi oluşturuldu: ${response.name}`);
      return response;
    } catch (error) {
      console.error("Fakturownia müşteri oluşturma hatası:", error);
      throw error;
    }
  }

  /**
   * Müşteri listesini getirir
   */
  async getClients(): Promise<Array<{ id: number; name: string; tax_no?: string }>> {
    try {
      return await this.makeRequest<Array<{ id: number; name: string; tax_no?: string }>>(
        "clients.json"
      );
    } catch (error) {
      console.error("Fakturownia müşteri listesi hatası:", error);
      throw error;
    }
  }

  /**
   * API bağlantısını test eder
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest<any>("invoices.json");
      return true;
    } catch (error) {
      console.error("Fakturownia bağlantı testi başarısız:", error);
      return false;
    }
  }
}

// Singleton instance
export const fakturowniaService = new FakturowniaService();