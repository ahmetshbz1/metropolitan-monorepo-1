// fakturownia-api-client.service.ts
// Low-level API client for Fakturownia
// Handles HTTP requests and error handling

import type { FakturowniaError } from "./fakturownia-types";

export class FakturowniaApiClientService {
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
   * Build API URL with token
   */
  private getApiUrl(endpoint: string): string {
    return `${this.apiUrl}/${endpoint}?api_token=${this.apiToken}`;
  }

  /**
   * HTTP request wrapper with enhanced error handling
   */
  async makeRequest<T>(
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
   * Download PDF content
   */
  async downloadPDF(invoiceId: number): Promise<Buffer> {
    const startTime = Date.now();
    const url = this.getApiUrl(`invoices/${invoiceId}.pdf`);
    
    try {
      console.log(`📥 Downloading PDF for Fakturownia invoice: ${invoiceId}`);
      
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
}