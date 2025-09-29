// "refresh-token.routes.ts"
// metropolitan backend
// Refresh token endpoint for JWT token rotation

import { logger } from "@bogeychan/elysia-logger";
import { t } from "elysia";

import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  createRateLimiter,
  rateLimitConfigs,
} from "../../../../shared/infrastructure/middleware/rate-limit";
import {
  generateDeviceFingerprint,
  extractDeviceInfo,
  generateJTI,
  verifyRefreshToken,
  verifyDeviceSession,
  updateSessionActivity,
  invalidateAllUserSessions,
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

        // Verify refresh token
        const payload = (await jwt.verify(refreshToken)) as EnhancedRefreshTokenPayload | false;

        if (!payload || payload.type !== "refresh") {
          log.warn({ message: "Invalid refresh token type" });
          set.status = 401;
          return {
            success: false,
            message: "Invalid refresh token",
          };
        }

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

        // Verify device fingerprint matches
        if (payload.deviceId !== currentDeviceId) {
          // Device mismatch - potential security breach
          log.error({
            userId: payload.sub,
            storedDeviceId: payload.deviceId,
            currentDeviceId,
            message: "Device fingerprint mismatch - potential security breach",
          });

          // Invalidate all user sessions for security
          await invalidateAllUserSessions(payload.sub);

          set.status = 401;
          return {
            success: false,
            message: "Device verification failed. Please login again.",
          };
        }

        // Verify refresh token in Redis
        const tokenValid = await verifyRefreshToken(
          payload.sub,
          payload.jti,
          payload.deviceId
        );

        if (!tokenValid.valid) {
          log.warn({
            userId: payload.sub,
            message: "Refresh token not found in Redis or device mismatch",
          });
          set.status = 401;
          return {
            success: false,
            message: "Invalid refresh token",
          };
        }

        // Verify device session is still active
        const sessionValid = await verifyDeviceSession(
          payload.sub,
          payload.deviceId,
          payload.sessionId
        );

        if (!sessionValid) {
          log.warn({
            userId: payload.sub,
            message: "Device session not found or inactive",
          });
          set.status = 401;
          return {
            success: false,
            message: "Session expired. Please login again.",
          };
        }

        // Update session activity
        await updateSessionActivity(payload.sub, payload.deviceId);

        // Generate new access token with fresh JTI
        const newAccessJTI = generateJTI();
        const newAccessToken = await jwt.sign({
          sub: payload.sub,
          type: "access",
          sessionId: payload.sessionId,
          deviceId: payload.deviceId,
          jti: newAccessJTI,
          aud: "mobile-app",
          iss: "metropolitan-api",
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour (was 15 minutes)
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
          expiresIn: 3600, // 1 hour in seconds (was 900)
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
        "user-agent": t.Optional(t.String()),
        "x-platform": t.Optional(t.String()),
        "x-device-model": t.Optional(t.String()),
        "x-app-version": t.Optional(t.String()),
        "x-screen-resolution": t.Optional(t.String()),
        "x-timezone": t.Optional(t.String()),
        "accept-language": t.Optional(t.String()),
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