// "logout.routes.ts"
// metropolitan backend
// Logout operations routes

import { logger } from "@bogeychan/elysia-logger";

import { blacklistToken } from "../../../../shared/infrastructure/database/redis";
import { createApp } from "../../../../shared/infrastructure/web/app";

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
          exp: number;
        };

        if (!profile || typeof profile.exp !== "number") {
          // Guard should prevent this, but double check
          return { success: false, message: "Invalid token." };
        }

        // Calculate remaining TTL and blacklist token
        const expiresIn = profile.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await blacklistToken(token, expiresIn);
        }

        log.info({ userId: profile.userId }, `User logged out successfully`);
        return { success: true, message: "Logged out successfully." };
      })
  );