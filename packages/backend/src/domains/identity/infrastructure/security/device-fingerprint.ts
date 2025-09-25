// "device-fingerprint.ts"
// metropolitan backend
// Device fingerprinting and session management for enhanced security

import { createHash, randomBytes } from "crypto";
import { redis } from "../../../../shared/infrastructure/database/redis";

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
  sub: string;           // User ID (subject)
  iat?: number;          // Issued at
  exp: number;           // Expires at (15 minutes)
  aud: string;           // Audience (mobile-app)
  iss: string;           // Issuer (metropolitan-api)
  type: 'access';        // Token type
  sessionId: string;     // Session identifier
  deviceId: string;      // Device fingerprint
  scope?: string[];      // Permissions array
  jti: string;           // Unique token ID (JWT ID)
}

export interface EnhancedRefreshTokenPayload {
  sub: string;           // User ID
  iat?: number;          // Issued at
  exp: number;           // Expires at (30 days)
  aud: string;           // Audience
  iss: string;           // Issuer
  type: 'refresh';       // Token type
  sessionId: string;     // Session identifier
  deviceId: string;      // Device fingerprint
  jti: string;           // Unique token ID
}

/**
 * Generate unique JWT ID
 */
export function generateJTI(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `sess_${randomBytes(24).toString('hex')}`;
}

/**
 * Generate device fingerprint from device info and headers
 * Creates a unique identifier for the device
 */
export function generateDeviceFingerprint(
  deviceInfo: DeviceInfo,
  headers: Record<string, string | undefined>
): string {
  // Combine device characteristics
  const fingerprintData = [
    deviceInfo.userAgent || 'unknown',
    deviceInfo.platform || 'unknown',
    deviceInfo.deviceModel || 'unknown',
    deviceInfo.appVersion || 'unknown',
    deviceInfo.screenResolution || 'unknown',
    deviceInfo.timezone || 'unknown',
    deviceInfo.language || 'unknown',
    headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
  ].join('|');

  // Generate SHA-256 hash
  const fingerprint = createHash('sha256')
    .update(fingerprintData)
    .digest('hex');

  return `dev_${fingerprint.substring(0, 32)}`;
}

/**
 * Extract device info from headers
 */
export function extractDeviceInfo(headers: Record<string, string | undefined>): DeviceInfo {
  return {
    userAgent: headers['user-agent'],
    platform: headers['x-platform'], // Mobile app should send this
    deviceModel: headers['x-device-model'],
    appVersion: headers['x-app-version'],
    screenResolution: headers['x-screen-resolution'],
    timezone: headers['x-timezone'],
    language: headers['accept-language'],
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
      const existingSession: SessionInfo = JSON.parse(existingSessionData as string);
      if (existingSession.sessionId && existingSession.sessionId !== sessionId) {
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
  await redis.setex(sessionKey, 30 * 24 * 60 * 60, JSON.stringify({
    userId,
    deviceId,
  }));
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
 * Update session activity
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
      session.lastActivity = Date.now();

      // Update with remaining TTL
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        await redis.setex(key, ttl, JSON.stringify(session));
      }
    } catch {
      // Session corrupted, ignore
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
    } catch (error) {
      // Session corrupted, delete it anyway to be safe
      keysToDelete.push(sessionKey);
    }
  }

  // Delete all keys at once
  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
    console.warn(`[SECURITY] All sessions invalidated for user: ${userId} (${keysToDelete.length} keys deleted)`);
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

  return sessions.filter(s => s.isActive);
}

/**
 * Store refresh token with device binding
 */
export async function storeRefreshToken(
  userId: string,
  refreshToken: string,
  deviceId: string,
  sessionId: string,
  jti: string
): Promise<void> {
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
        if (parsed.deviceId === deviceId && existingKey !== `refresh_token:${userId}:${jti}`) {
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

  // Store with 30-day TTL
  await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(data));
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
      sessionId: tokenData.sessionId
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Remove all refresh tokens for a user
 */
export async function removeAllUserRefreshTokens(userId: string): Promise<void> {
  const pattern = `refresh_token:${userId}:*`;
  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(...(keys as string[]));
    console.log(`[SECURITY] Removed ${keys.length} refresh tokens for user: ${userId}`);
  }
}

/**
 * Blacklist JWT by JTI
 */
export async function blacklistJTI(jti: string, expiresIn: number): Promise<void> {
  const key = `blacklist_jti:${jti}`;
  await redis.setex(key, expiresIn, 'true');
}

/**
 * Check if JTI is blacklisted
 */
export async function isJTIBlacklisted(jti: string): Promise<boolean> {
  const key = `blacklist_jti:${jti}`;
  const result = await redis.get(key);
  return result === 'true';
}