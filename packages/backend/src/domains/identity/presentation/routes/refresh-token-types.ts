// "refresh-token-types.ts"
// metropolitan backend
// Type definitions and validation schemas for refresh token operations

import { t } from "elysia";
import type { Logger } from "@bogeychan/elysia-logger";
import type { JWTPayloadSpec } from "@elysiajs/jwt";

// Request body types
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Response types
export interface RefreshTokenSuccessResponse {
  success: true;
  accessToken: string;
  refreshToken?: string; // Only returned when device fingerprint changes
  expiresIn: number;
}

export interface RefreshTokenErrorResponse {
  success: false;
  message: string;
}

export type RefreshTokenResponse =
  | RefreshTokenSuccessResponse
  | RefreshTokenErrorResponse;

// Header types
export interface RefreshTokenHeaders {
  "user-agent"?: string;
  "x-platform"?: string;
  "x-device-model"?: string;
  "x-timezone"?: string;
  "accept-language"?: string;
  "x-forwarded-for"?: string;
  "x-real-ip"?: string;
  authorization?: string;
  [key: string]: string | undefined; // Index signature for compatibility
}

// Device info types
export interface DeviceInfo {
  timezone: string;
  userAgent: string;
  platform: string;
  deviceModel: string;
  language: string;
}

// JWT Service type
export interface JWTService {
  sign: (payload: JWTPayloadSpec) => Promise<string>;
  verify: (token: string) => Promise<JWTPayloadSpec | false>;
}

// Validation schemas
export const refreshTokenBodySchema = t.Object({
  refreshToken: t.String({
    minLength: 50,
    error: "Valid refresh token required",
  }),
});

export const refreshTokenHeadersSchema = t.Object({
  // Mobile device fingerprinting için gerekli stabil header'lar
  "x-platform": t.Optional(t.String()),
  "x-device-model": t.Optional(t.String()),
  "x-timezone": t.Optional(t.String()),
  // IP tracking için
  "x-forwarded-for": t.Optional(t.String()),
  "x-real-ip": t.Optional(t.String()),
});

// Helper types
export interface RefreshFlowParams {
  payload: {
    sub: string;
    type: string;
    exp: number;
    deviceId: string;
    sessionId: string;
    jti: string;
    userType?: string;
  };
  headers: RefreshTokenHeaders;
  jwt: JWTService;
  log: Logger;
}

export interface RefreshFlowResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
  statusCode?: number;
}
