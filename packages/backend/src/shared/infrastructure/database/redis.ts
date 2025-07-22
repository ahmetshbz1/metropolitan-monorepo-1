//  "redis.ts"
//  metropolitan backend
//  Created by Ahmet on 20.06.2025.

import "dotenv/config";
import Redis from "ioredis";

// Yeni Redis istemcisi oluşturuluyor
// Bağlantı detayları .env üzerinden alınır, eksikse varsayılanlar kullanılır
const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // TODO: Sonsuz tekrar yerine uygun bir limit belirlenmeli
});

redisClient.on("connect", () => {
  console.log("Redis bağlantısı başarılı!");
});
// TODO: Bu error'u kullanıcıya özel yapıp, kullanıcının token'larının sadece o kullanıcı için geçerli olmasını sağlamak gerekiyor.
redisClient.on("error", (err) => {
  console.error("Redis bağlantı hatası.", err);
});

const BLACKLIST_PREFIX = "blacklist:";
// TODO: Bu prefix'i kullanıcıya özel yapıp, kullanıcının token'larının sadece o kullanıcı için geçerli olmasını sağlamak gerekiyor.
/**
 * Bir JWT'yi kara listeye ekler. Token, JWT süresi dolunca Redis'ten otomatik silinir.
 * @param token Kara listeye eklenecek JWT
 * @param expiresIn Token'ın kalan geçerlilik süresi (saniye)
 */
export async function blacklistToken(
  token: string,
  expiresIn: number
): Promise<void> {
  await redisClient.setex(`${BLACKLIST_PREFIX}${token}`, expiresIn, "true");
}

/**
 * Bir JWT'nin kara listede olup olmadığını kontrol eder.
 * @param token Kontrol edilecek JWT
 * @returns Token kara listede ise true, değilse false döner
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const result = await redisClient.get(`${BLACKLIST_PREFIX}${token}`);
  return result === "true";
}

export { redisClient as redis };
export default redisClient;
