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

        const profile = (await jwt.verify(token)) as
          | { userId: string; exp: number }
          | false;
        if (!profile) {
          return { profile: null };
        }

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