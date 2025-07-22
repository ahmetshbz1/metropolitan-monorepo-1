//  "nip-cache.service.ts"
//  metropolitan backend
//  Created by Ahmet on 16.06.2025.

import redis from "../database/redis";

interface CachedNipInfo {
  success: boolean;
  companyName?: string;
  message?: string;
  // Polish government API'den gelen detaylı bilgiler
  nip?: string;
  statusVat?: string;
  regon?: string;
  krs?: string;
  workingAddress?: string;
  registrationDate?: string;
}

export class NipCacheService {
  private static readonly CACHE_PREFIX = "nip:";
  private static readonly CACHE_TTL = 7 * 24 * 60 * 60; // 7 gün (saniye)

  /**
   * Redis'ten NIP bilgisini getir
   */
  static async getCachedNip(nip: string): Promise<CachedNipInfo | null> {
    try {
      const cacheKey = this.generateCacheKey(nip);
      const cachedData = await redis.get(cacheKey);

      if (!cachedData) {
        return null;
      }

      return JSON.parse(cachedData) as CachedNipInfo;
    } catch (error) {
      console.error("Redis NIP cache get error:", error);
      return null; // Cache hatası durumunda null döner, API'ye gider
    }
  }

  /**
   * NIP bilgisini Redis'e kaydet
   */
  static async setCachedNip(
    nip: string,
    nipInfo: CachedNipInfo
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(nip);
      const dataToCache = JSON.stringify(nipInfo);

      await redis.setex(cacheKey, this.CACHE_TTL, dataToCache);
    } catch (error) {
      console.error("Redis NIP cache set error:", error);
      // Cache hatası durumunda sessizce devam et
    }
  }

  /**
   * Cache key oluştur
   */
  private static generateCacheKey(nip: string): string {
    const cleanedNip = nip.replace(/[-\s]/g, "");
    return `${this.CACHE_PREFIX}${cleanedNip}`;
  }

  /**
   * Belirli bir NIP'in cache'ini temizle
   */
  static async clearCachedNip(nip: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(nip);
      await redis.del(cacheKey);
    } catch (error) {
      console.error("Redis NIP cache clear error:", error);
    }
  }

  /**
   * Tüm NIP cache'lerini temizle (development/testing için)
   */
  static async clearAllNipCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Redis NIP cache clear all error:", error);
    }
  }
}
