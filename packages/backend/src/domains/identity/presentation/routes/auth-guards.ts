// "auth-guards.ts"
// metropolitan backend
// Authentication guards and utilities

import { isTokenBlacklisted } from "../../../../shared/infrastructure/database/redis";

/**
 * Auth token verification guard
 * Checks JWT token validity and blacklist status
 */
export const authTokenGuard = {
  async beforeHandle({ jwt, headers, error }: any) {
    const token = headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return error(401, "Unauthorized");
    }

    const profile = (await jwt.verify(token)) as {
      userId: string;
      exp: number;
    };
    
    if (!profile) {
      return error(401, "Unauthorized");
    }

    if (await isTokenBlacklisted(token)) {
      return error(401, "Token is blacklisted. Please log in again.");
    }
  },
};

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