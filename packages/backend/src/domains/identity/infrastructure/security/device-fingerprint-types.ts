// "device-fingerprint-types.ts"
// metropolitan backend
// Type definitions and constants for device fingerprinting and session management

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
