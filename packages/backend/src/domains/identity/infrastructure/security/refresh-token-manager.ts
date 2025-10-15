// "refresh-token-manager.ts"
// metropolitan backend
// Refresh token management with device binding and security controls

import { redis } from "../../../../shared/infrastructure/database/redis";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import type { SessionInfo } from "./device-fingerprint-types";
import { SESSION_MAX_LIFETIME } from "./device-fingerprint-types";
import { invalidateAllUserSessions } from "./device-session-manager";

/**
 * Store refresh token with device binding
 * Respects session maximum lifetime for security
 */
export async function storeRefreshToken(
  userId: string,
  refreshToken: string,
  deviceId: string,
  sessionId: string,
  jti: string
): Promise<void> {
  // Get session to check its creation time
  const sessionKey = `device_session:${userId}:${deviceId}`;
  const sessionData = await redis.get(sessionKey);

  let sessionCreatedAt = Date.now(); // Default to now if session not found
  if (sessionData) {
    try {
      const session: SessionInfo = JSON.parse(sessionData as string);
      sessionCreatedAt = session.createdAt;
    } catch (error) {
      // Session corrupted, use current time
      logger.warn(
        { userId, deviceId, error },
        "SECURITY: Could not parse session for refresh token TTL calculation, using current time"
      );
    }
  }

  // Calculate TTL based on session lifetime
  const sessionAge = Date.now() - sessionCreatedAt;
  const remainingLifetime = SESSION_MAX_LIFETIME - sessionAge;
  const remainingLifetimeSeconds = Math.floor(remainingLifetime / 1000);

  // Refresh token should not outlive the session
  const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days
  const ttl = Math.min(REFRESH_TOKEN_TTL, remainingLifetimeSeconds);

  // Safety check: TTL must be positive
  if (ttl <= 0) {
    logger.warn(
      { userId, ttl },
      "SECURITY: Refresh token TTL calculated as invalid, not storing"
    );
    return;
  }

  // Clean up old refresh tokens for this device
  const pattern = `refresh_token:${userId}:*`;
  const existingKeys = await redis.keys(pattern);

  // Check and delete old refresh tokens for the same device
  for (const existingKey of existingKeys as string[]) {
    try {
      const existingData = await redis.get(existingKey);
      if (existingData) {
        const parsed = JSON.parse(existingData as string);
        // Delete old refresh tokens for the same device
        if (
          parsed.deviceId === deviceId &&
          existingKey !== `refresh_token:${userId}:${jti}`
        ) {
          await redis.del(existingKey);
        }
      }
    } catch (error) {
      // Ignore parsing errors
      logger.error({ error, userId }, "Failed to parse refresh token for cleanup");
    }
  }

  const key = `refresh_token:${userId}:${jti}`;
  const data = {
    token: refreshToken,
    deviceId,
    sessionId,
    createdAt: Date.now(),
  };

  // Store with calculated TTL (respects session max lifetime)
  await redis.setex(key, ttl, JSON.stringify(data));
}

/**
 * Verify refresh token and device binding
 */
export async function verifyRefreshToken(
  userId: string,
  jti: string,
  deviceId: string
): Promise<{ valid: boolean; sessionId?: string }> {
  const key = `refresh_token:${userId}:${jti}`;
  const data = await redis.get(key);

  if (!data) {
    return { valid: false };
  }

  try {
    const tokenData = JSON.parse(data as string);

    // Verify device binding
    if (tokenData.deviceId !== deviceId) {
      // Device mismatch - potential security issue
      logger.warn(
        { userId, jti, expectedDevice: tokenData.deviceId, receivedDevice: deviceId },
        "SECURITY: Device mismatch for refresh token"
      );
      await invalidateAllUserSessions(userId);
      return { valid: false };
    }

    return {
      valid: true,
      sessionId: tokenData.sessionId,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Remove all refresh tokens for a user
 */
export async function removeAllUserRefreshTokens(
  userId: string
): Promise<void> {
  const pattern = `refresh_token:${userId}:*`;
  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(...(keys as string[]));
    logger.info(
      { userId, tokensRemoved: keys.length },
      "SECURITY: Removed refresh tokens for user"
    );
  }
}
