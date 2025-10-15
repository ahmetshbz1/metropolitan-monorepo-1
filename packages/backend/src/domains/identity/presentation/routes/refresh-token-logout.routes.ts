// "refresh-token-logout.routes.ts"
// metropolitan backend
// Logout all devices endpoint for invalidating all user sessions

import { logger } from "@bogeychan/elysia-logger";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  invalidateAllUserSessions,
  blacklistJTI,
} from "../../infrastructure/security/device-fingerprint";

/**
 * Logout all devices endpoint
 * Kullanıcının tüm cihazlarındaki session'ları invalidate eder
 */
export const logoutAllDevicesRoutes = createApp()
  .use(logger({ level: "info" }))
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
