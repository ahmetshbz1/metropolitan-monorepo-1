// fakturownia-product.service.ts
// Service for managing Fakturownia products
// Handles product listing and search operations

import { logger } from "../monitoring/logger.config";

import { FakturowniaApiClientService } from "./fakturownia-api-client.service";
import type { FakturowniaProduct } from "./fakturownia-types";

export class FakturowniaProductService {
  private apiClient: FakturowniaApiClientService;

  constructor() {
    this.apiClient = new FakturowniaApiClientService();
  }

  /**
   * Tüm ürünleri listele (tüm sayfaları çek)
   */
  async listProducts(): Promise<FakturowniaProduct[]> {
    try {
      logger.info("Fakturownia ürünleri listeleniyor");

      const allProducts: FakturowniaProduct[] = [];
      let page = 1;
      const perPage = 100; // Maksimum değer

      while (true) {
        logger.debug({ page }, "Sayfa çekiliyor");

        const response = await this.apiClient.makeRequest<FakturowniaProduct[]>(
          `products.json?page=${page}&per_page=${perPage}`,
          {
            method: "GET",
          }
        );

        if (!response || response.length === 0) {
          break;
        }

        allProducts.push(...response);
        logger.debug({ page, count: response.length }, "Sayfa ürünleri bulundu");

        if (response.length < perPage) {
          break;
        }

        page++;
      }

      logger.info({ totalCount: allProducts.length }, "Fakturownia ürünleri listelendi");
      return allProducts;
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Fakturownia ürün listeleme hatası"
      );
      throw new Error(
        `Fakturownia ürün listeleme hatası: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ürün koduna göre ara
   */
  async searchProductByCode(code: string): Promise<FakturowniaProduct | null> {
    try {
      logger.info({ code }, "Fakturownia ürün aranıyor");

      const products = await this.apiClient.makeRequest<FakturowniaProduct[]>(
        `products.json?code=${encodeURIComponent(code)}`,
        {
          method: "GET",
        }
      );

      if (products && products.length > 0) {
        logger.info({ code, productId: products[0].id }, "Fakturownia ürün bulundu");
        return products[0];
      }

      logger.warn({ code }, "Fakturownia ürün bulunamadı");
      return null;
    } catch (error) {
      logger.error(
        { code, error: error instanceof Error ? error.message : String(error) },
        "Fakturownia ürün arama hatası"
      );
      throw new Error(
        `Fakturownia ürün arama hatası: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * ID'ye göre ürün getir
   */
  async getProduct(productId: number): Promise<FakturowniaProduct> {
    try {
      logger.info({ productId }, "Fakturownia ürün getiriliyor");

      const response = await this.apiClient.makeRequest<FakturowniaProduct>(
        `products/${productId}.json`,
        {
          method: "GET",
        }
      );

      logger.info({ productId, productName: response.name }, "Fakturownia ürün getirildi");
      return response;
    } catch (error) {
      logger.error(
        { productId, error: error instanceof Error ? error.message : String(error) },
        "Fakturownia ürün getirme hatası"
      );
      throw new Error(
        `Fakturownia ürün getirme hatası: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ürün bilgilerini güncelle (stock, tax, vb)
   */
  async updateProduct(
    productId: number,
    updates: {
      stock?: number;
      tax?: number;
      price?: number;
    }
  ): Promise<FakturowniaProduct> {
    try {
      logger.info({ productId, updates }, "Fakturownia ürün güncelleniyor");

      const response = await this.apiClient.makeRequest<FakturowniaProduct>(
        `products/${productId}.json`,
        {
          method: "PUT",
          body: JSON.stringify({
            product: {
              ...(updates.stock !== undefined && { quantity: updates.stock }),
              ...(updates.tax !== undefined && { tax: updates.tax }),
              ...(updates.price !== undefined && { price_net: updates.price }),
            },
          }),
        }
      );

      logger.info({ productId, productName: response.name }, "Fakturownia ürün güncellendi");
      return response;
    } catch (error) {
      logger.error(
        { productId, error: error instanceof Error ? error.message : String(error) },
        "Fakturownia ürün güncelleme hatası"
      );
      throw new Error(
        `Fakturownia ürün güncelleme hatası: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
