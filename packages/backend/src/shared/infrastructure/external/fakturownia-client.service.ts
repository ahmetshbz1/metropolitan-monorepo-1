// fakturownia-client.service.ts
// Client management operations for Fakturownia
// Create and retrieve client information

import { logger } from "../monitoring/logger.config";

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

      logger.info({ clientName: response.name, clientId: response.id }, "Fakturownia müşterisi oluşturuldu");
      return response;
    } catch (error) {
      logger.error(
        { clientName: client.name, error: error instanceof Error ? error.message : String(error) },
        "Fakturownia müşteri oluşturma hatası"
      );
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
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Fakturownia müşteri listesi hatası"
      );
      throw error;
    }
  }
}