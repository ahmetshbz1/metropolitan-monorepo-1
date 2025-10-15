// "refresh-token.routes.ts"
// metropolitan backend
// Refresh token endpoint for JWT token rotation

import { logger } from "@bogeychan/elysia-logger";
import { t } from "elysia";

import { redis } from "../../../../shared/infrastructure/database/redis";
import {
  createRateLimiter,
  rateLimitConfigs,
} from "../../../../shared/infrastructure/middleware/rate-limit";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  generateDeviceFingerprint,
  extractDeviceInfo,
  generateJTI,
  generateSessionId,
  verifyRefreshToken,
  verifyDeviceSession,
  updateSessionActivity,
  storeDeviceSession,
  storeRefreshToken,
  invalidateAllUserSessions,
  invalidateSession,
  blacklistJTI,
  type EnhancedRefreshTokenPayload,
} from "../../infrastructure/security/device-fingerprint";

export const refreshTokenRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(createRateLimiter(rateLimitConfigs.refreshToken))
  .post(
    "/auth/refresh",
    async ({ body, headers, jwt, log, set }) => {
      try {
        const { refreshToken } = body;

        log.info({ message: "[REFRESH] Token refresh request received" });

        // Verify refresh token
        const payload = (await jwt.verify(refreshToken)) as EnhancedRefreshTokenPayload | false;

        if (!payload || payload.type !== "refresh") {
          log.warn({ message: "[REFRESH] Invalid refresh token type or verification failed" });
          set.status = 401;
          return {
            success: false,
            message: "Invalid refresh token",
          };
        }

        log.info({
          userId: payload.sub,
          deviceId: payload.deviceId,
          sessionId: payload.sessionId,
          message: "[REFRESH] Token verified successfully"
        });

        // Check if token is expired
        if (payload.exp < Math.floor(Date.now() / 1000)) {
          log.warn({ userId: payload.sub, message: "Refresh token expired" });
          set.status = 401;
          return {
            success: false,
            message: "Refresh token expired",
          };
        }

        // Extract current device fingerprint
        const deviceInfo = extractDeviceInfo(headers);
        const currentDeviceId = generateDeviceFingerprint(deviceInfo, headers);

        // Get userType from payload if available, otherwise fallback to "individual"
        const userType = (payload as any).userType || "individual";

        // Check if device fingerprint changed
        const deviceFingerprintChanged = payload.deviceId !== currentDeviceId;

        if (deviceFingerprintChanged) {
          // SECURITY: Device fingerprint changed - create NEW session with NEW createdAt
          // Bu sayede session extension attack önlenir

          // Calculate changed fields for logging
          const changedFields: string[] = [];
          const oldDeviceInfo = extractDeviceInfo({
            "user-agent": headers["user-agent"],
            "x-platform": headers["x-platform"],
            "x-device-model": headers["x-device-model"],
            "x-timezone": headers["x-timezone"],
            "accept-language": headers["accept-language"],
          });

          if (oldDeviceInfo.timezone !== deviceInfo.timezone) changedFields.push("timezone");
          if (oldDeviceInfo.userAgent !== deviceInfo.userAgent) changedFields.push("userAgent");
          if (oldDeviceInfo.platform !== deviceInfo.platform) changedFields.push("platform");
          if (oldDeviceInfo.deviceModel !== deviceInfo.deviceModel) changedFields.push("deviceModel");
          if (oldDeviceInfo.language !== deviceInfo.language) changedFields.push("language");

          // Get old session info for logging
          const oldSessionKey = `device_session:${payload.sub}:${payload.deviceId}`;
          const oldSessionData = await redis.get(oldSessionKey);
          let oldSessionAge = 0;

          if (oldSessionData) {
            try {
              const oldSession = JSON.parse(oldSessionData as string);
              oldSessionAge = Math.floor((Date.now() - oldSession.createdAt) / (24 * 60 * 60 * 1000)); // days
            } catch {
              // Ignore parse errors
            }
          }

          log.warn({
            userId: payload.sub,
            oldDeviceId: payload.deviceId,
            newDeviceId: currentDeviceId,
            changedFields,
            oldSessionAgeDays: oldSessionAge,
            message: "Device fingerprint changed - creating NEW session (createdAt reset for security)",
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
          });

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
          });

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

        // Normal flow - device fingerprint hasn't changed
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
            message: "[REFRESH] ❌ Refresh token not found in Redis or device mismatch",
          });
          set.status = 401;
          return {
            success: false,
            message: "Invalid refresh token",
          };
        }

        log.info({
          userId: payload.sub,
          message: "[REFRESH] ✅ Refresh token verified in Redis"
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
            message: "[REFRESH] ❌ Device session not found or inactive in Redis",
          });
          set.status = 401;
          return {
            success: false,
            message: "Session expired. Please login again.",
          };
        }

        log.info({
          userId: payload.sub,
          message: "[REFRESH] ✅ Device session verified"
        });

        // Update session activity
        await updateSessionActivity(payload.sub, payload.deviceId);

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
        });

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
      } catch (error: any) {
        log.error({
          error: error.message,
          message: "Token refresh failed",
        });

        set.status = 500;
        return {
          success: false,
          message: "Token refresh failed",
        };
      }
    },
    {
      body: t.Object({
        refreshToken: t.String({
          minLength: 50,
          error: "Valid refresh token required",
        }),
      }),
      headers: t.Object({
        // Mobile device fingerprinting için gerekli stabil header'lar
        "x-platform": t.Optional(t.String()),
        "x-device-model": t.Optional(t.String()),
        "x-timezone": t.Optional(t.String()),
        // IP tracking için
        "x-forwarded-for": t.Optional(t.String()),
        "x-real-ip": t.Optional(t.String()),
      }),
    }
  )
  // Logout all devices endpoint
  .post(
    "/auth/logout-all-devices",
    async ({ headers, jwt, log, set }) => {
      try {
        // Extract token from header
        const authHeader = headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          set.status = 401;
          return {
            success: false,
            message: "No token provided",
          };
        }

        const token = authHeader.substring(7);
        const payload = (await jwt.verify(token)) as any;

        if (!payload || !payload.sub) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid token",
          };
        }

        // Invalidate all user sessions
        await invalidateAllUserSessions(payload.sub);

        // Blacklist current token
        if (payload.jti && payload.exp) {
          const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
          if (expiresIn > 0) {
            await blacklistJTI(payload.jti, expiresIn);
          }
        }

        log.info({
          userId: payload.sub,
          message: "All devices logged out successfully",
        });

        return {
          success: true,
          message: "All devices have been logged out",
        };
      } catch (error: any) {
        log.error({
          error: error.message,
          message: "Logout all devices failed",
        });

        set.status = 500;
        return {
          success: false,
          message: "Logout failed",
        };
      }
    }
  );