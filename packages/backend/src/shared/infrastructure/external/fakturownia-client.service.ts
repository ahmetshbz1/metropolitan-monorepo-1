// fakturownia-client.service.ts
// Client management operations for Fakturownia
// Create and retrieve client information

import { FakturowniaApiClientService } from "./fakturownia-api-client.service";
import type { FakturowniaClient } from "./fakturownia-types";

export class FakturowniaClientService {
  private apiClient: FakturowniaApiClientService;

  constructor() {
    this.apiClient = new FakturowniaApiClientService();
  }

  /**
   * Create new client
   */
  async createClient(client: FakturowniaClient): Promise<{ id: number; name: string; tax_no?: string }> {
    try {
      const response = await this.apiClient.makeRequest<{ id: number; name: string; tax_no?: string }>(
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
   * Get client list
   */
  async getClients(): Promise<Array<{ id: number; name: string; tax_no?: string }>> {
    try {
      return await this.apiClient.makeRequest<Array<{ id: number; name: string; tax_no?: string }>>(
        "clients.json"
      );
    } catch (error) {
      console.error("Fakturownia müşteri listesi hatası:", error);
      throw error;
    }
  }
}