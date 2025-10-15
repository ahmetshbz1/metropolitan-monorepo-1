//  "auth.guard.ts"
//  metropolitan backend
//  Created by Ahmet on 16.06.2025.

import { logger } from "@bogeychan/elysia-logger";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

import { isTokenBlacklisted } from "../../infrastructure/database/redis";
import { isUserBlacklisted } from "../../../domains/identity/infrastructure/security/jwt-blacklist-manager";

interface JWTPayload {
  sub?: string;
  userId?: string;
  exp: number;
  type: string;
  userType?: "individual" | "corporate";
  sessionId?: string;
  deviceId?: string;
}

interface UserProfile {
  userId: string;
  sub?: string;
  exp: number;
  type: string;
  userType: "individual" | "corporate";
  sessionId?: string;
  deviceId?: string;
}

export const isAuthenticated = (app: Elysia) =>
  app
    .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET! }))
    .derive(async ({ jwt, headers, request }) => {
      const token = headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return { profile: null };
      }

      try {
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
          return { profile: null };
        }

        const decoded = (await jwt.verify(token)) as JWTPayload | false;
        if (!decoded) {
          return { profile: null };
        }

        // Support both 'sub' (standard JWT) and 'userId' (legacy) fields
        const userId = decoded.sub || decoded.userId;
        if (!userId) {
          logger.warn({ decodedFields: Object.keys(decoded) }, "Token missing userId/sub field");
          return { profile: null };
        }

        // Check if all user tokens are blacklisted (logout all devices, account deletion, etc.)
        const isUserTokensBlacklisted = await isUserBlacklisted(userId);
        if (isUserTokensBlacklisted) {
          logger.info({ userId }, "User tokens are blacklisted");
          return { profile: null };
        }

        const profile: UserProfile = {
          userId,
          sub: decoded.sub,
          exp: decoded.exp,
          type: decoded.type,
          userType: decoded.userType || "individual",
          sessionId: decoded.sessionId,
          deviceId: decoded.deviceId,
        };

        return { profile };
      } catch (error) {
        // Token geçersiz veya süresi dolmuş
        return { profile: null };
      }
    })
    .guard({
      beforeHandle: ({ profile, set }) => {
        if (!profile) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }
      },
    });
