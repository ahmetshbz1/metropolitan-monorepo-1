// "refresh-token.routes.ts"
// metropolitan backend
// Main orchestrator for refresh token operations

import { logger } from "@bogeychan/elysia-logger";
import {
  createRateLimiter,
  rateLimitConfigs,
} from "../../../../shared/infrastructure/middleware/rate-limit";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  generateDeviceFingerprint,
  extractDeviceInfo,
  type EnhancedRefreshTokenPayload,
} from "../../infrastructure/security/device-fingerprint";
import {
  refreshTokenBodySchema,
  refreshTokenHeadersSchema,
} from "./refresh-token-types";
import { handleDeviceFingerprintMigration } from "./refresh-token-device-migration";
import { handleNormalRefreshFlow } from "./refresh-token-normal-flow";
import { logoutAllDevicesRoutes } from "./refresh-token-logout.routes";

/**
 * Refresh token routes
 * Token rotation ve device fingerprint tracking için ana endpoint
 */
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

        // Check if device fingerprint changed
        const deviceFingerprintChanged = payload.deviceId !== currentDeviceId;

        if (deviceFingerprintChanged) {
          // Device fingerprint değişmiş - migration flow
          const result = await handleDeviceFingerprintMigration({
            payload,
            headers,
            jwt,
            log,
          });

          if (!result.success && result.statusCode) {
            set.status = result.statusCode;
          }

          return result;
        }

        // Normal flow - device fingerprint hasn't changed
        const result = await handleNormalRefreshFlow({
          payload,
          headers,
          jwt,
          log,
        });

        if (!result.success && result.statusCode) {
          set.status = result.statusCode;
        }

        return result;
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
      body: refreshTokenBodySchema,
      headers: refreshTokenHeadersSchema,
    }
  )
  // Logout all devices endpoint'ini compose et
  .use(logoutAllDevicesRoutes);
