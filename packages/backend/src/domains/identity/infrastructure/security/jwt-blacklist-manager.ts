// "jwt-blacklist-manager.ts"
// metropolitan backend
// JWT blacklist management for token revocation

import { redis } from "../../../../shared/infrastructure/database/redis";

/**
 * Blacklist JWT by JTI
 */
export async function blacklistJTI(
  jti: string,
  expiresIn: number
): Promise<void> {
  const key = `blacklist_jti:${jti}`;
  await redis.setex(key, expiresIn, "true");
}

/**
 * Check if JTI is blacklisted
 */
export async function isJTIBlacklisted(jti: string): Promise<boolean> {
  const key = `blacklist_jti:${jti}`;
  const result = await redis.get(key);
  return result === "true";
}

/**
 * Blacklist all tokens for a specific user
 * Kullanıcının tüm token'larını geçersiz kılar (logout all devices, account deletion, etc.)
 */
export async function blacklistUserTokens(
  userId: string,
  expiresIn: number = 2592000 // 30 gün (max refresh token süresi)
): Promise<void> {
  const key = `blacklist_user:${userId}`;
  await redis.setex(key, expiresIn, "true");
}

/**
 * Check if all user tokens are blacklisted
 * Kullanıcının tüm token'larının blacklist'te olup olmadığını kontrol eder
 */
export async function isUserBlacklisted(userId: string): Promise<boolean> {
  const key = `blacklist_user:${userId}`;
  const result = await redis.get(key);
  return result === "true";
}

/**
 * Remove user from blacklist
 * Kullanıcının blacklist kaydını kaldırır (debugging veya reactivation için)
 */
export async function removeUserBlacklist(userId: string): Promise<void> {
  const key = `blacklist_user:${userId}`;
  await redis.del(key);
}
