// "device-fingerprint-generator.ts"
// metropolitan backend
// Device fingerprint generation and unique ID utilities

import { createHash, randomBytes } from "crypto";

import type { DeviceInfo } from "./device-fingerprint-types";

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
