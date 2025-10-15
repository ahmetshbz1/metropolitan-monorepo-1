// "device-session-manager.ts"
// metropolitan backend
// Device session management with Redis persistence

import { redis } from "../../../../shared/infrastructure/database/redis";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import type { DeviceInfo, SessionInfo } from "./device-fingerprint-types";
import { SESSION_IDLE_TIMEOUT, SESSION_MAX_LIFETIME } from "./device-fingerprint-types";

/**
 * Store device session in Redis
 */
export async function storeDeviceSession(
  userId: string,
  deviceId: string,
  sessionId: string,
  deviceInfo: DeviceInfo,
  ipAddress?: string
): Promise<void> {
  // First check if there's an existing session for this device
  const existingKey = `device_session:${userId}:${deviceId}`;
  const existingSessionData = await redis.get(existingKey);

  // If there's an existing session, clean up its session lookup key
  if (existingSessionData) {
    try {
      const existingSession: SessionInfo = JSON.parse(
        existingSessionData as string
      );
      if (
        existingSession.sessionId &&
        existingSession.sessionId !== sessionId
      ) {
        // Delete the old session lookup key
        const oldSessionKey = `session:${existingSession.sessionId}`;
        await redis.del(oldSessionKey);
      }
    } catch (error) {
      // Ignore parsing errors for corrupted sessions
      logger.error({ error, userId, deviceId }, "Failed to parse existing session for cleanup");
    }
  }

  const session: SessionInfo = {
    userId,
    deviceId,
    sessionId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    deviceInfo,
    ipAddress,
    isActive: true,
  };

  // Store with 30-day TTL
  await redis.setex(existingKey, 30 * 24 * 60 * 60, JSON.stringify(session));

  // Also store session lookup key
  const sessionKey = `session:${sessionId}`;
  await redis.setex(
    sessionKey,
    30 * 24 * 60 * 60,
    JSON.stringify({
      userId,
      deviceId,
    })
  );
}

/**
 * Verify device session
 */
export async function verifyDeviceSession(
  userId: string,
  deviceId: string,
  sessionId: string
): Promise<boolean> {
  const key = `device_session:${userId}:${deviceId}`;
  const sessionData = await redis.get(key);

  if (!sessionData) {
    return false;
  }

  try {
    const session: SessionInfo = JSON.parse(sessionData as string);
    return session.sessionId === sessionId && session.isActive;
  } catch {
    return false;
  }
}

/**
 * Update session activity with throttling for performance
 * Uses sliding window with maximum lifetime for security
 *
 * Throttling: Session TTL yenileme sadece 5 dakikada bir yapılır
 * Bu sayede her request'te Redis write overhead'i azalır
 */
export async function updateSessionActivity(
  userId: string,
  deviceId: string
): Promise<void> {
  const key = `device_session:${userId}:${deviceId}`;
  const sessionData = await redis.get(key);

  if (sessionData) {
    try {
      const session: SessionInfo = JSON.parse(sessionData as string);
      const now = Date.now();

      // Clock skew protection: Gelecekteki timestamp'leri reddet
      if (session.createdAt > now + 60000) {
        logger.error(
          { userId, sessionCreatedAt: session.createdAt, now },
          "SECURITY: Invalid session timestamp detected (clock skew)"
        );
        await redis.del(key);
        const sessionKey = `session:${session.sessionId}`;
        await redis.del(sessionKey);
        return;
      }

      // Check if session has exceeded maximum lifetime
      const sessionAge = Math.max(0, now - session.createdAt);
      if (sessionAge >= SESSION_MAX_LIFETIME) {
        logger.warn(
          { userId, sessionAgeDays: Math.floor(sessionAge / (24 * 60 * 60 * 1000)) },
          "SECURITY: Session exceeded max lifetime"
        );
        await redis.del(key);

        const sessionKey = `session:${session.sessionId}`;
        await redis.del(sessionKey);
        return;
      }

      // Throttling: Sadece son activity'den 5 dakika geçtiyse TTL yenile
      const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 dakika
      const timeSinceLastActivity = now - session.lastActivity;

      if (timeSinceLastActivity < REFRESH_THRESHOLD) {
        // TTL yenilemeye gerek yok, Redis write overhead'inden kaçın
        return;
      }

      // Update last activity
      session.lastActivity = now;

      // Calculate remaining lifetime
      const remainingLifetime = SESSION_MAX_LIFETIME - sessionAge;
      const remainingLifetimeSeconds = Math.floor(remainingLifetime / 1000);

      // Use the smaller of: idle timeout or remaining lifetime
      const IDLE_TIMEOUT_SECONDS = Math.floor(SESSION_IDLE_TIMEOUT / 1000);
      const ttl = Math.min(IDLE_TIMEOUT_SECONDS, remainingLifetimeSeconds);

      // Safety check: TTL must be positive
      if (ttl <= 0) {
        logger.warn(
          { userId, ttl },
          "SECURITY: Session TTL calculated as invalid, deleting session"
        );
        await redis.del(key);
        const sessionKey = `session:${session.sessionId}`;
        await redis.del(sessionKey);
        return;
      }

      // Store with calculated TTL
      await redis.setex(key, ttl, JSON.stringify(session));

      // Also update session lookup key TTL
      const sessionKey = `session:${session.sessionId}`;
      const sessionLookupData = await redis.get(sessionKey);
      if (sessionLookupData) {
        await redis.setex(sessionKey, ttl, sessionLookupData as string);
      }
    } catch (error) {
      // JSON parse error veya corrupt session
      if (error instanceof SyntaxError) {
        logger.error(
          { userId, error },
          "SECURITY: Corrupt session data detected, deleting"
        );
        await redis.del(key);
      }
    }
  }
}

/**
 * Invalidate all user sessions (for security events)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const keysToDelete: string[] = [];

  // 1. Find all device sessions
  const devicePattern = `device_session:${userId}:*`;
  const deviceKeys = await redis.keys(devicePattern);
  keysToDelete.push(...(deviceKeys as string[]));

  // 2. Find all refresh tokens
  const refreshPattern = `refresh_token:${userId}:*`;
  const refreshKeys = await redis.keys(refreshPattern);
  keysToDelete.push(...(refreshKeys as string[]));

  // 3. Find all session lookups - scan ALL and filter
  const sessionPattern = `session:*`;
  const allSessionKeys = await redis.keys(sessionPattern);

  for (const sessionKey of allSessionKeys as string[]) {
    try {
      const sessionData = await redis.get(sessionKey);
      if (sessionData) {
        const data = JSON.parse(sessionData as string);
        if (data.userId === userId) {
          keysToDelete.push(sessionKey);
        }
      }
    } catch (_error) {
      // Session corrupted, delete it anyway to be safe
      keysToDelete.push(sessionKey);
    }
  }

  // Delete all keys at once
  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
    logger.warn(
      { userId, keysDeleted: keysToDelete.length },
      "SECURITY: All sessions invalidated for user"
    );
  }
}

/**
 * Invalidate specific session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  const sessionKey = `session:${sessionId}`;
  const sessionData = await redis.get(sessionKey);

  if (sessionData) {
    try {
      const { userId, deviceId } = JSON.parse(sessionData as string);

      // Delete device session
      const deviceKey = `device_session:${userId}:${deviceId}`;
      await redis.del(deviceKey);

      // Delete session lookup
      await redis.del(sessionKey);
    } catch {
      // Session corrupted, just delete the key
      await redis.del(sessionKey);
    }
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  const pattern = `device_session:${userId}:*`;
  const keys = await redis.keys(pattern);
  const sessions: SessionInfo[] = [];

  for (const key of keys as string[]) {
    const sessionData = await redis.get(key);
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData as string);
        sessions.push(session);
      } catch {
        // Corrupted session, ignore
      }
    }
  }

  return sessions.filter((s) => s.isActive);
}
