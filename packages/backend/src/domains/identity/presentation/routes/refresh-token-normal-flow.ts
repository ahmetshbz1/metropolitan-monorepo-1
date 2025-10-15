// "refresh-token-normal-flow.ts"
// metropolitan backend
// Normal refresh token flow when device fingerprint hasn't changed

import {
  verifyRefreshToken,
  verifyDeviceSession,
  updateSessionActivity,
  generateJTI,
} from "../../infrastructure/security/device-fingerprint";
import type { RefreshFlowParams, RefreshFlowResult } from "./refresh-token-types";

/**
 * Device fingerprint değişmediğinde normal refresh flow'unu gerçekleştirir
 * Token ve session doğrulaması yapılır, yeni access token üretilir
 */
export async function handleNormalRefreshFlow(
  params: RefreshFlowParams
): Promise<RefreshFlowResult> {
  const { payload, jwt, log } = params;

  log.info({
    userId: payload.sub,
    message: "[REFRESH] Normal flow - no fingerprint change detected"
  });

  // Verify refresh token in Redis
  const tokenValid = await verifyRefreshToken(
    payload.sub,
    payload.jti,
    payload.deviceId
  );

  if (!tokenValid.valid) {
    log.warn({
      userId: payload.sub,
      jti: payload.jti,
      deviceId: payload.deviceId,
      message: "[REFRESH] Refresh token not found in Redis or device mismatch",
    });

    return {
      success: false,
      message: "Invalid refresh token",
      statusCode: 401,
    };
  }

  log.info({
    userId: payload.sub,
    message: "[REFRESH] Refresh token verified in Redis"
  });

  // Verify device session is still active
  const sessionValid = await verifyDeviceSession(
    payload.sub,
    payload.deviceId,
    payload.sessionId
  );

  if (!sessionValid) {
    log.warn({
      userId: payload.sub,
      deviceId: payload.deviceId,
      sessionId: payload.sessionId,
      message: "[REFRESH] Device session not found or inactive in Redis",
    });

    return {
      success: false,
      message: "Session expired. Please login again.",
      statusCode: 401,
    };
  }

  log.info({
    userId: payload.sub,
    message: "[REFRESH] Device session verified"
  });

  // Update session activity
  await updateSessionActivity(payload.sub, payload.deviceId);

  // Get userType from payload if available, otherwise fallback to "individual"
  const userType = (payload as any).userType || "individual";

  // Generate new access token with fresh JTI
  const newAccessJTI = generateJTI();
  const newAccessToken = await jwt.sign({
    sub: payload.sub,
    type: "access",
    userType,
    sessionId: payload.sessionId,
    deviceId: payload.deviceId,
    jti: newAccessJTI,
    aud: "mobile-app",
    iss: "metropolitan-api",
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  } as any);

  log.info({
    userId: payload.sub,
    deviceId: payload.deviceId,
    sessionId: payload.sessionId,
    message: "Access token refreshed successfully",
  });

  return {
    success: true,
    accessToken: newAccessToken,
    expiresIn: 3600,
  };
}
