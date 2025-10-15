// "refresh-token-device-migration.ts"
// metropolitan backend
// Device fingerprint migration logic for refresh token operations

import { redis } from "../../../../shared/infrastructure/database/redis";
import {
  extractDeviceInfo,
  generateDeviceFingerprint,
  generateJTI,
  generateSessionId,
  invalidateSession,
  storeDeviceSession,
  storeRefreshToken,
} from "../../infrastructure/security/device-fingerprint";

import type {
  RefreshFlowParams,
  RefreshFlowResult,
} from "./refresh-token-types";

/**
 * Device fingerprint değiştiğinde session migration işlemini gerçekleştirir
 * SECURITY: Yeni session oluşturulur, createdAt sıfırlanır (session extension attack önlenir)
 */
export async function handleDeviceFingerprintMigration(
  params: RefreshFlowParams
): Promise<RefreshFlowResult> {
  const { payload, headers, jwt, log } = params;

  // Extract current device fingerprint
  const deviceInfo = extractDeviceInfo(headers);
  const currentDeviceId = generateDeviceFingerprint(deviceInfo, headers);

  // Get userType from payload if available, otherwise fallback to "individual"
  const userType = (payload as any).userType || "individual";

  // SECURITY: Device fingerprint changed - create NEW session with NEW createdAt
  // Bu sayede session extension attack önlenir

  // Calculate changed fields for logging
  const changedFields = await calculateChangedFields(
    headers,
    deviceInfo
  );

  // Get old session info for logging
  const oldSessionAge = await getOldSessionAge(payload.sub, payload.deviceId);

  log.warn({
    userId: payload.sub,
    oldDeviceId: payload.deviceId,
    newDeviceId: currentDeviceId,
    changedFields,
    oldSessionAgeDays: oldSessionAge,
    message:
      "Device fingerprint changed - creating NEW session (createdAt reset for security)",
  });

  // Invalidate old session
  await invalidateSession(payload.sessionId);

  // Create NEW session with CURRENT timestamp (createdAt = now)
  // SECURITY: Bu sayede saldırgan fingerprint değiştirerek session'ı uzatamaz
  const newSessionId = generateSessionId();
  await storeDeviceSession(
    payload.sub,
    currentDeviceId,
    newSessionId,
    deviceInfo,
    headers["x-forwarded-for"] || headers["x-real-ip"]
  );

  // NOT: Artık createdAt'ı eski session'dan kopyalamıyoruz
  // Yeni session her zaman Date.now() ile başlıyor

  // Generate new access token with new device fingerprint
  const newAccessJTI = generateJTI();
  const newAccessToken = await jwt.sign({
    sub: payload.sub,
    type: "access",
    userType,
    sessionId: newSessionId,
    deviceId: currentDeviceId, // Use new device fingerprint
    jti: newAccessJTI,
    aud: "mobile-app",
    iss: "metropolitan-api",
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  } as any);

  // Generate new refresh token with new device fingerprint
  const newRefreshJTI = generateJTI();
  const newRefreshToken = await jwt.sign({
    sub: payload.sub,
    type: "refresh",
    userType,
    sessionId: newSessionId,
    deviceId: currentDeviceId, // Use new device fingerprint
    jti: newRefreshJTI,
    aud: "mobile-app",
    iss: "metropolitan-api",
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  } as any);

  // Store new refresh token
  await storeRefreshToken(
    payload.sub,
    newRefreshToken,
    currentDeviceId,
    newSessionId,
    newRefreshJTI
  );

  log.info({
    userId: payload.sub,
    newDeviceId: currentDeviceId,
    newSessionId,
    message: "Session migrated to new device fingerprint successfully",
  });

  return {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken, // Return new refresh token
    expiresIn: 3600,
  };
}

/**
 * Değişen device fingerprint alanlarını hesaplar
 */
async function calculateChangedFields(
  headers: {
    "user-agent"?: string;
    "x-platform"?: string;
    "x-device-model"?: string;
    "x-timezone"?: string;
    "accept-language"?: string;
  },
  currentDeviceInfo: ReturnType<typeof extractDeviceInfo>
): Promise<string[]> {
  const changedFields: string[] = [];

  const oldDeviceInfo = extractDeviceInfo({
    "user-agent": headers["user-agent"],
    "x-platform": headers["x-platform"],
    "x-device-model": headers["x-device-model"],
    "x-timezone": headers["x-timezone"],
    "accept-language": headers["accept-language"],
  });

  if (oldDeviceInfo.timezone !== currentDeviceInfo.timezone) {
    changedFields.push("timezone");
  }
  if (oldDeviceInfo.userAgent !== currentDeviceInfo.userAgent) {
    changedFields.push("userAgent");
  }
  if (oldDeviceInfo.platform !== currentDeviceInfo.platform) {
    changedFields.push("platform");
  }
  if (oldDeviceInfo.deviceModel !== currentDeviceInfo.deviceModel) {
    changedFields.push("deviceModel");
  }
  if (oldDeviceInfo.language !== currentDeviceInfo.language) {
    changedFields.push("language");
  }

  return changedFields;
}

/**
 * Eski session'ın yaşını gün cinsinden döndürür
 */
async function getOldSessionAge(
  userId: string,
  deviceId: string
): Promise<number> {
  const oldSessionKey = `device_session:${userId}:${deviceId}`;
  const oldSessionData = await redis.get(oldSessionKey);

  if (!oldSessionData) {
    return 0;
  }

  try {
    const oldSession = JSON.parse(oldSessionData as string);
    const ageInDays = Math.floor(
      (Date.now() - oldSession.createdAt) / (24 * 60 * 60 * 1000)
    );
    return ageInDays;
  } catch {
    // Ignore parse errors
    return 0;
  }
}
