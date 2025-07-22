//  "invoice-cache.service.ts"
//  metropolitan backend
//  Created by Ahmet on 10.07.2025.

import { redis } from "../../../../shared/infrastructure/database/redis";

export class InvoiceCacheService {
  private static readonly CACHE_PREFIX = "invoice_pdf:";
  private static readonly FAKTUROWNIA_ID_PREFIX = "fakturownia_id:";
  private static readonly CACHE_TTL = 24 * 60 * 60; // 24 saat (saniye cinsinden)

  /**
   * Fatura PDF cache key'ini oluşturur
   */
  private static getCacheKey(orderId: string): string {
    return `${this.CACHE_PREFIX}${orderId}`;
  }

  /**
   * Fakturownia ID cache key'ini oluşturur
   */
  private static getFakturowniaIdCacheKey(orderId: string): string {
    return `${this.FAKTUROWNIA_ID_PREFIX}${orderId}`;
  }

  /**
   * Cache'den fatura PDF'ini getirir
   */
  static async getCachedPDF(orderId: string): Promise<Buffer | null> {
    try {
      const cacheKey = this.getCacheKey(orderId);
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        // Base64 string'i Buffer'a çevir
        return Buffer.from(cachedData, "base64");
      }

      return null;
    } catch (error) {
      console.error("Cache okuma hatası:", error);
      return null; // Cache hatası durumunda null dön, PDF yeniden oluşturulsun
    }
  }

  /**
   * Fatura PDF'ini cache'e kaydeder
   */
  static async cachePDF(orderId: string, pdfBuffer: Buffer): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(orderId);
      // Buffer'ı base64 string'e çevir
      const base64Data = pdfBuffer.toString("base64");

      await redis.setex(cacheKey, this.CACHE_TTL, base64Data);

      console.log(`Fatura PDF cache'lendi: ${orderId}`);
    } catch (error) {
      console.error("Cache yazma hatası:", error);
      // Cache hatası durumunda sessizce devam et, PDF oluşturma işlemini kesme
    }
  }

  /**
   * Belirli bir siparişin fatura cache'ini siler
   */
  static async clearCache(orderId: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(orderId);
      await redis.del(cacheKey);

      console.log(`Fatura cache temizlendi: ${orderId}`);
    } catch (error) {
      console.error("Cache temizleme hatası:", error);
    }
  }

  /**
   * Sipariş güncellendiğinde cache'i temizle
   * (Sipariş servisleri bu metodu çağırabilir)
   */
  static async clearCacheOnOrderUpdate(orderId: string): Promise<void> {
    await this.clearCache(orderId);
  }

  /**
   * Cache istatistiklerini getirir (isteğe bağlı, debug için)
   */
  static async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
  }> {
    try {
      const keys = await redis.keys(`${this.CACHE_PREFIX}*`);
      const info = await redis.info("memory");

      // Memory usage bilgisini parse et
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch?.[1]?.trim() ?? "N/A";

      return {
        totalKeys: keys.length,
        memoryUsage,
      };
    } catch (error) {
      console.error("Cache stats hatası:", error);
      return { totalKeys: 0, memoryUsage: "N/A" };
    }
  }

  /**
   * Fakturownia fatura ID'sini cache'e kaydeder
   */
  static async cacheFakturowniaId(orderId: string, fakturowniaId: number): Promise<void> {
    try {
      const cacheKey = this.getFakturowniaIdCacheKey(orderId);
      await redis.setex(cacheKey, this.CACHE_TTL, fakturowniaId.toString());

      console.log(`Fakturownia ID cache'lendi: ${orderId} -> ${fakturowniaId}`);
    } catch (error) {
      console.error("Fakturownia ID cache yazma hatası:", error);
    }
  }

  /**
   * Cache'den Fakturownia fatura ID'sini getirir
   */
  static async getCachedFakturowniaId(orderId: string): Promise<number | null> {
    try {
      const cacheKey = this.getFakturowniaIdCacheKey(orderId);
      const cachedId = await redis.get(cacheKey);

      if (cachedId) {
        const fakturowniaId = parseInt(cachedId, 10);
        return isNaN(fakturowniaId) ? null : fakturowniaId;
      }

      return null;
    } catch (error) {
      console.error("Fakturownia ID cache okuma hatası:", error);
      return null;
    }
  }

  /**
   * Hem PDF hem de Fakturownia ID cache'ini temizler
   */
  static async clearInvoiceAndFakturowniaCache(orderId: string): Promise<void> {
    try {
      const pdfCacheKey = this.getCacheKey(orderId);
      const fakturowniaCacheKey = this.getFakturowniaIdCacheKey(orderId);

      await redis.del(pdfCacheKey, fakturowniaCacheKey);

      console.log(`Fatura ve Fakturownia cache temizlendi: ${orderId}`);
    } catch (error) {
      console.error("Kombinasyon cache temizleme hatası:", error);
    }
  }

  /**
   * Tüm fatura cache'lerini temizler (maintenance için)
   */
  static async clearAllInvoiceCache(): Promise<number> {
    try {
      const pdfKeys = await redis.keys(`${this.CACHE_PREFIX}*`);
      const fakturowniaKeys = await redis.keys(`${this.FAKTUROWNIA_ID_PREFIX}*`);
      const allKeys = [...pdfKeys, ...fakturowniaKeys];

      if (allKeys.length > 0) {
        const result = await redis.del(...allKeys);
        const deletedCount = typeof result === "number" ? result : 0;
        console.log(`${deletedCount} fatura cache'i (PDF + Fakturownia ID) temizlendi`);
        return deletedCount;
      }

      return 0;
    } catch (error) {
      console.error("Tüm cache temizleme hatası:", error);
      return 0;
    }
  }
}
