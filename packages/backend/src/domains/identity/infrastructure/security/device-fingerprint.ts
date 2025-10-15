// "device-fingerprint.ts"
// metropolitan backend
// Main orchestrator for device fingerprinting and session management
// Re-exports all functionality for backward compatibility

// Export all types and constants
export type {
  DeviceInfo,
  SessionInfo,
  EnhancedAccessTokenPayload,
  EnhancedRefreshTokenPayload,
} from "./device-fingerprint-types";

export {
  SESSION_IDLE_TIMEOUT,
  SESSION_MAX_LIFETIME,
} from "./device-fingerprint-types";

// Export device fingerprint generators
export {
  generateJTI,
  generateSessionId,
  generateDeviceFingerprint,
  extractDeviceInfo,
} from "./device-fingerprint-generator";

// Export session management
export {
  storeDeviceSession,
  verifyDeviceSession,
  updateSessionActivity,
  invalidateAllUserSessions,
  invalidateSession,
  getUserSessions,
} from "./device-session-manager";

// Export refresh token management
export {
  storeRefreshToken,
  verifyRefreshToken,
  removeAllUserRefreshTokens,
} from "./refresh-token-manager";

// Export JWT blacklist management
export {
  blacklistJTI,
  isJTIBlacklisted,
} from "./jwt-blacklist-manager";
