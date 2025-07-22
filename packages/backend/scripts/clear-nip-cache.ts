//  "clear-nip-cache.ts"
//  metropolitan backend
//  Created by Ahmet on 09.07.2025.

import redis from "../src/shared/infrastructure/database/redis";
import { logger } from "../src/shared/infrastructure/monitoring/logger.config";

async function clearNipCache() {
  logger.info("Tüm NIP önbelleği temizleniyor...");

  try {
    const stream = redis.scanStream({
      match: "nip:*",
      count: 100,
    });

    let keys: string[] = [];
    let deletedCount = 0;

    for await (const newKeys of stream) {
      keys.push(...(newKeys as string[]));
      if (keys.length > 0) {
        deletedCount += await redis.del(keys);
        keys = [];
      }
    }

    if (deletedCount > 0) {
      logger.info(`${deletedCount} NIP önbellek kaydı başarıyla silindi.`);
    } else {
      logger.info("Silinecek NIP önbellek kaydı bulunamadı.");
    }
  } catch (error) {
    logger.error("NIP önbelleği temizlenirken bir hata oluştu:", error);
  } finally {
    await redis.quit();
    logger.info("Redis bağlantısı kapatıldı.");
  }
}

clearNipCache();
