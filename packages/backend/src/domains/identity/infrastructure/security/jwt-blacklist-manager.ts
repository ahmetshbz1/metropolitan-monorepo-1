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
