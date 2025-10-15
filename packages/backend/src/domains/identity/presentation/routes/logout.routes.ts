// "logout.routes.ts"
// metropolitan backend
// Logout operations routes

import { logger } from "@bogeychan/elysia-logger";

import { blacklistToken } from "../../../../shared/infrastructure/database/redis";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  invalidateSession,
  removeAllUserRefreshTokens
} from "../../infrastructure/security/device-fingerprint";
import { blacklistUserTokens } from "../../infrastructure/security/jwt-blacklist-manager";

import { authTokenGuard, extractToken } from "./auth-guards";

export const logoutRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/auth", (app) =>
    app
      // Apply auth guard for logout endpoint
      .guard(authTokenGuard)
      .post("/logout", async ({ headers, jwt, log, error }) => {
        const token = extractToken(headers.authorization);
        if (!token) {
          return error(401, "No token provided");
        }

        const profile = (await jwt.verify(token)) as {
          userId: string;
          sub?: string;
          exp: number;
          sessionId?: string;
          deviceId?: string;
        };

        if (!profile || typeof profile.exp !== "number") {
          // Guard should prevent this, but double check
          return { success: false, message: "Invalid token." };
        }

        const userId = profile.sub || profile.userId;
        if (!userId) {
          return { success: false, message: "Invalid token - no user ID." };
        }

        // Clear all Redis data for proper logout
        try {
          // 1. Invalidate the current session if available
          if (profile.sessionId) {
            await invalidateSession(profile.sessionId);
          }

          // 2. Remove all user refresh tokens
          await removeAllUserRefreshTokens(userId);

          // 3. Blacklist all user tokens (logout from all devices)
          await blacklistUserTokens(userId);

          // 4. Calculate remaining TTL and blacklist current access token (fallback)
          const expiresIn = profile.exp - Math.floor(Date.now() / 1000);
          if (expiresIn > 0) {
            await blacklistToken(token, expiresIn);
          }

          log.info({ userId }, `User logged out from all devices and all tokens invalidated successfully`);
        } catch (error) {
          log.error({ userId, error }, `Failed to clear Redis data during logout`);
          // Don't fail the logout if Redis cleanup partially fails
        }

        return { success: true, message: "Logged out successfully." };
      })
  );