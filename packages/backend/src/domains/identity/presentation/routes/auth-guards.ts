// "auth-guards.ts"
// metropolitan backend
// Authentication guards and utilities

import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { isTokenBlacklisted } from "../../../../shared/infrastructure/database/redis";

/**
 * Auth token verification guard
 * Checks JWT token validity and blacklist status
 */
export const authTokenGuard = (app: Elysia) =>
  app
    .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET! }))
    .derive(async ({ jwt, headers }) => {
      const token = headers.authorization?.replace("Bearer ", "");
      if (!token) return { profile: null };

      try {
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) return { profile: null };

        const decoded = (await jwt.verify(token)) as any;
        if (!decoded) {
          return { profile: null };
        }

        // Support both 'sub' (standard JWT) and 'userId' (legacy) fields
        const userId = decoded.sub || decoded.userId;
        if (!userId) {
          console.log("Auth guard - Token missing userId/sub field:", decoded);
          return { profile: null };
        }

        const profile = {
          userId,
          exp: decoded.exp,
          type: decoded.type,
          sessionId: decoded.sessionId,
          deviceId: decoded.deviceId,
        };

        return { profile };
      } catch (_error) {
        // Token geçersiz veya süresi dolmuş
        return { profile: null };
      }
    })
    .guard({
      beforeHandle: ({ profile, error }) => {
        if (!profile) {
          return error(401, "Unauthorized");
        }
      },
    });

/**
 * Extract token from authorization header
 */
export function extractToken(authorization?: string): string | null {
  if (!authorization) return null;
  return authorization.replace("Bearer ", "");
}

/**
 * Validate phone number format
 */
export const phoneNumberSchema = {
  pattern: "^\\+[1-9]\\d{1,14}$",
  error: "Invalid phone number format. Please use E.164 format (e.g., +905551234567).",
};

/**
 * User type enum validation
 */
export const userTypeEnum = ["individual", "corporate"] as const;