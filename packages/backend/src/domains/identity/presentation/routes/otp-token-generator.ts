// "otp-token-generator.ts"
// metropolitan backend
// Token generation for complete and incomplete profiles

import type { Logger } from "@bogeychan/elysia-logger";

import {
  extractDeviceInfo,
  generateDeviceFingerprint,
  generateJTI,
  generateSessionId,
  storeDeviceSession,
  storeRefreshToken,
} from "../../infrastructure/security/device-fingerprint";

import type {
  JWTService,
  OtpHeaders,
  UserRecord,
  VerifyOtpSuccessResponse,
} from "./otp-types";

// Generate full login tokens for users with complete profiles
export async function generateFullLoginTokens(
  user: UserRecord,
  headers: OtpHeaders,
  jwt: JWTService,
  log: Logger
): Promise<VerifyOtpSuccessResponse> {
  // Extract device info for fingerprinting
  const deviceInfo = extractDeviceInfo(headers);
  const deviceId = generateDeviceFingerprint(deviceInfo, headers);
  const sessionId = generateSessionId();
  const ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"];

  const accessJTI = generateJTI();
  const refreshJTI = generateJTI();

  // Access token (1 hour)
  const accessToken = await jwt.sign({
    sub: user.id,
    type: "access",
    userType: user.userType,
    sessionId,
    deviceId,
    jti: accessJTI,
    aud: "mobile-app",
    iss: "metropolitan-api",
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  });

  // Refresh token (30 days)
  const refreshToken = await jwt.sign({
    sub: user.id,
    type: "refresh",
    userType: user.userType,
    sessionId,
    deviceId,
    jti: refreshJTI,
    aud: "mobile-app",
    iss: "metropolitan-api",
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  });

  // Store device session and refresh token
  await storeDeviceSession(
    user.id,
    deviceId,
    sessionId,
    deviceInfo,
    ipAddress
  );
  await storeRefreshToken(user.id, refreshToken, deviceId, sessionId, refreshJTI);

  log.info({
    userId: user.id,
    deviceId,
    sessionId,
    message: "Login successful with enhanced security",
  });

  return {
    success: true,
    message: "Login successful.",
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}

// Generate registration token for users with incomplete profiles
export async function generateRegistrationToken(
  user: UserRecord,
  jwt: JWTService
): Promise<VerifyOtpSuccessResponse> {
  // Profile incomplete, issue registration token
  const registrationToken = await jwt.sign({
    sub: "registration", // Subject claim to identify the token's purpose
    userId: user.id, // Include user ID to prevent race conditions
    phoneNumber: user.phoneNumber,
    userType: user.userType,
    exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes expiration
  });

  return {
    success: true,
    message: "OTP verified. Please complete your profile.",
    registrationToken,
  };
}
