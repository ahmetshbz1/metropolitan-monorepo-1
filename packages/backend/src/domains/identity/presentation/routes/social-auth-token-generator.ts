// "social-auth-token-generator.ts"
// metropolitan backend
// JWT token generation and session management for social auth

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
  SocialAuthHeaders,
  SocialAuthBody,
} from "./social-auth-types";
import type { User } from "./social-auth-user-resolver";

export interface TokenGenerationResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  deviceId: string;
  sessionId: string;
}

/**
 * Social auth için JWT token'ları oluşturur ve session yönetimi yapar
 *
 * İşlem adımları:
 * 1. Device fingerprint oluştur
 * 2. Session ID ve JTI'lar oluştur
 * 3. Access token oluştur (1 saat)
 * 4. Refresh token oluştur (30 gün)
 * 5. Device session kaydet
 * 6. Refresh token kaydet
 *
 * @param user - Kullanıcı
 * @param headers - HTTP headers
 * @param jwt - JWT service
 * @param log - Logger instance
 * @param body - Social auth request body (logging için)
 * @returns Token'lar ve session bilgileri
 */
export async function generateSocialAuthTokens(
  user: User,
  headers: SocialAuthHeaders,
  jwt: JWTService,
  log: Logger,
  body: SocialAuthBody
): Promise<TokenGenerationResult> {
  // Device bilgilerini çıkar ve fingerprint oluştur
  const deviceInfo = extractDeviceInfo(headers);
  const deviceId = generateDeviceFingerprint(deviceInfo, headers);
  const sessionId = generateSessionId();
  const ipAddress = (headers["x-forwarded-for"] || headers["x-real-ip"]) as
    | string
    | undefined;

  // Unique identifiers oluştur
  const accessJTI = generateJTI();
  const refreshJTI = generateJTI();

  // Access token (1 saat)
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

  // Refresh token (30 gün)
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

  // Device session ve refresh token'ı kaydet
  await storeDeviceSession(user.id, deviceId, sessionId, deviceInfo, ipAddress);
  await storeRefreshToken(user.id, refreshToken, deviceId, sessionId, refreshJTI);

  log.info(
    {
      userId: user.id,
      deviceId,
      sessionId,
      provider: body.provider,
      message: "Social auth login successful",
    },
    "Social auth token generation completed"
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds (UI için eski değer korundu)
    deviceId,
    sessionId,
  };
}
