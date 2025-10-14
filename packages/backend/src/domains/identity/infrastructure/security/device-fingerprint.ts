// "device-fingerprint.ts"
// metropolitan backend
// Device fingerprinting and session management for enhanced security

import { createHash, randomBytes } from "crypto";

import { redis } from "../../../../shared/infrastructure/database/redis";

// Session security constants
export const SESSION_IDLE_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days idle timeout (milliseconds)
export const SESSION_MAX_LIFETIME = 90 * 24 * 60 * 60 * 1000; // 90 days maximum session lifetime (milliseconds)

// Device info interface
export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  deviceModel?: string;
  appVersion?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
}

// Session info interface
export interface SessionInfo {
  userId: string;
  deviceId: string;
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
  isActive: boolean;
}

// Enhanced JWT payload interfaces
export interface EnhancedAccessTokenPayload {
  sub: string; // User ID (subject)
  iat?: number; // Issued at
  exp: number; // Expires at (15 minutes)
  aud: string; // Audience (mobile-app)
  iss: string; // Issuer (metropolitan-api)
  type: "access"; // Token type
  sessionId: string; // Session identifier
  deviceId: string; // Device fingerprint
  scope?: string[]; // Permissions array
  jti: string; // Unique token ID (JWT ID)
}

export interface EnhancedRefreshTokenPayload {
  sub: string; // User ID
  iat?: number; // Issued at
  exp: number; // Expires at (30 days)
  aud: string; // Audience
  iss: string; // Issuer
  type: "refresh"; // Token type
  sessionId: string; // Session identifier
  deviceId: string; // Device fingerprint
  jti: string; // Unique token ID
}

/**
 * Generate unique JWT ID
 */
export function generateJTI(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `sess_${randomBytes(24).toString("hex")}`;
}

/**
 * Generate device fingerprint from device info and headers
 * Creates a unique identifier for the device
 *
 * IMPORTANT: For web platform, we exclude IP address and volatile fields
 * because they change frequently (Wi-Fi/mobile switching, browser updates, zoom/resize)
 */
export function generateDeviceFingerprint(
  deviceInfo: DeviceInfo,
  headers: Record<string, string | undefined>
): string {
  const platform = headers["x-platform"] || deviceInfo.platform || "unknown";
  const isWebPlatform = platform.toLowerCase() === "web";

  // For web: Use only stable characteristics (no IP, no screen resolution, no app version)
  // For mobile: Use only STABLE characteristics to prevent session invalidation
  const fingerprintData = isWebPlatform
    ? [
        deviceInfo.userAgent || "unknown",
        platform,
        deviceInfo.deviceModel || "unknown",
        deviceInfo.timezone || "unknown",
        deviceInfo.language || "unknown",
      ].join("|")
    : [
        // Only stable device characteristics for mobile
        platform,
        deviceInfo.deviceModel || "unknown",
        deviceInfo.timezone || "unknown",
        // Removed: userAgent (changes with OS updates)
        // Removed: screenResolution (changes with orientation/zoom)
        // Removed: IP address (changes with network switching)
        // Removed: appVersion (changes with app updates)
      ].join("|");

  // Generate SHA-256 hash
  const fingerprint = createHash("sha256")
    .update(fingerprintData)
    .digest("hex");

  return `dev_${fingerprint.substring(0, 32)}`;
}

/**
 * Extract device info from headers
 */
export function extractDeviceInfo(
  headers: Record<string, string | undefined>
): DeviceInfo {
  return {
    userAgent: headers["user-agent"],
    platform: headers["x-platform"], // Mobile app should send this
    deviceModel: headers["x-device-model"],
    appVersion: headers["x-app-version"],
    screenResolution: headers["x-screen-resolution"],
    timezone: headers["x-timezone"],
    language: headers["accept-language"],
  };
}

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
      console.error(`Failed to parse existing session for cleanup: ${error}`);
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
        console.error(`[SECURITY] Invalid session timestamp detected (clock skew) for user: ${userId}`);
        await redis.del(key);
        const sessionKey = `session:${session.sessionId}`;
        await redis.del(sessionKey);
        return;
      }

      // Check if session has exceeded maximum lifetime
      const sessionAge = Math.max(0, now - session.createdAt);
      if (sessionAge >= SESSION_MAX_LIFETIME) {
        console.warn(`[SECURITY] Session exceeded max lifetime for user: ${userId}, age: ${Math.floor(sessionAge / (24 * 60 * 60 * 1000))} days`);
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
        console.warn(`[SECURITY] Session TTL calculated as ${ttl}, deleting session for user: ${userId}`);
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
        console.error(`[SECURITY] Corrupt session data detected for user: ${userId}, deleting`);
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
    console.warn(
      `[SECURITY] All sessions invalidated for user: ${userId} (${keysToDelete.length} keys deleted)`
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
    } catch {
      // Session corrupted, use current time
      console.warn(`[SECURITY] Could not parse session for refresh token TTL calculation, using current time`);
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
    console.warn(`[SECURITY] Refresh token TTL calculated as ${ttl}, not storing for user: ${userId}`);
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
      console.error(`Failed to parse refresh token for cleanup: ${error}`);
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
      console.warn(`[SECURITY] Device mismatch for refresh token: ${jti}`);
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
    console.log(
      `[SECURITY] Removed ${keys.length} refresh tokens for user: ${userId}`
    );
  }
}

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
