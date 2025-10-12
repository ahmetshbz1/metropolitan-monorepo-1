// fakturownia-product.service.ts
// Service for managing Fakturownia products
// Handles product listing and search operations

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
      console.log("📦 Fakturownia: Ürünler listeleniyor...");

      const allProducts: FakturowniaProduct[] = [];
      let page = 1;
      const perPage = 100; // Maksimum değer

      while (true) {
        console.log(`  Sayfa ${page} çekiliyor...`);

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
        console.log(`  Sayfa ${page}: ${response.length} ürün bulundu`);

        if (response.length < perPage) {
          break;
        }

        page++;
      }

      console.log(`✅ Fakturownia: Toplam ${allProducts.length} ürün bulundu`);
      return allProducts;
    } catch (error) {
      console.error("❌ Fakturownia ürün listeleme hatası:", error);
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
      console.log(`🔍 Fakturownia: Ürün aranıyor (code: ${code})...`);

      const products = await this.apiClient.makeRequest<FakturowniaProduct[]>(
        `products.json?code=${encodeURIComponent(code)}`,
        {
          method: "GET",
        }
      );

      if (products && products.length > 0) {
        console.log(`✅ Fakturownia: Ürün bulundu (ID: ${products[0].id})`);
        return products[0];
      }

      console.log("⚠️ Fakturownia: Ürün bulunamadı");
      return null;
    } catch (error) {
      console.error("❌ Fakturownia ürün arama hatası:", error);
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
      console.log(`📦 Fakturownia: Ürün getiriliyor (ID: ${productId})...`);

      const response = await this.apiClient.makeRequest<FakturowniaProduct>(
        `products/${productId}.json`,
        {
          method: "GET",
        }
      );

      console.log(`✅ Fakturownia: Ürün getirildi (${response.name})`);
      return response;
    } catch (error) {
      console.error("❌ Fakturownia ürün getirme hatası:", error);
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
      console.log(`🔄 Fakturownia: Ürün güncelleniyor (ID: ${productId})...`, updates);

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

      console.log(`✅ Fakturownia: Ürün güncellendi (${response.name})`);
      return response;
    } catch (error) {
      console.error("❌ Fakturownia ürün güncelleme hatası:", error);
      throw new Error(
        `Fakturownia ürün güncelleme hatası: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
