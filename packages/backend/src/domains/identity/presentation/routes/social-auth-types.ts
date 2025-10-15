// "social-auth-types.ts"
// metropolitan backend
// Type definitions and validation schemas for social authentication

import { t } from "elysia";
import type { Logger } from "@bogeychan/elysia-logger";
import type { JWTPayloadSpec } from "@elysiajs/jwt";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// Request body types
export interface SocialAuthBody {
  firebaseUid: string;
  email?: string;
  provider: "apple" | "google";
  appleUserId?: string;
}

// Response types - New user case
export interface SocialAuthNewUserResponse {
  success: true;
  userExists: false;
  profileComplete: false;
  message: string;
}

// Response types - Profile incomplete case
export interface SocialAuthIncompleteProfileResponse {
  success: true;
  userExists: true;
  profileComplete: false;
  message: string;
}

// Response types - Provider conflict case
export interface SocialAuthProviderConflictResponse {
  success: false;
  userExists?: boolean;
  profileComplete?: boolean;
  error: "PROVIDER_CONFLICT";
  message: string;
  existingProvider?: string;
  attemptedProvider?: string;
  suggestedAction?: string;
}

// Response types - Linking success case
export interface SocialAuthLinkingSuccessResponse {
  success: true;
  linked: true;
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Record<string, unknown>;
}

// Response types - Login success case
export interface SocialAuthLoginSuccessResponse {
  success: true;
  userExists: true;
  profileComplete: true;
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Record<string, unknown>;
}

export type SocialAuthResponse =
  | SocialAuthNewUserResponse
  | SocialAuthIncompleteProfileResponse
  | SocialAuthProviderConflictResponse
  | SocialAuthLinkingSuccessResponse
  | SocialAuthLoginSuccessResponse;

// Header types
export interface SocialAuthHeaders {
  authorization?: string;
  Authorization?: string;
  "user-agent"?: string;
  "x-platform"?: string;
  "x-device-model"?: string;
  "x-timezone"?: string;
  "accept-language"?: string;
  "x-forwarded-for"?: string;
  "x-real-ip"?: string;
  [key: string]: string | undefined;
}

// JWT types
export interface JWTService {
  sign: (payload: JWTPayloadSpec) => Promise<string>;
  verify: (token: string) => Promise<JWTPayloadSpec | false>;
}

// JWT Payload for decoded tokens
export interface DecodedAccessToken {
  sub?: string;
  type?: string;
  userType?: string;
  sessionId?: string;
  deviceId?: string;
  jti?: string;
  aud?: string;
  iss?: string;
  exp?: number;
}

// Database types
export type DatabaseClient = PostgresJsDatabase<Record<string, never>>;

// Context types
export interface SocialAuthContext {
  body: SocialAuthBody;
  headers: SocialAuthHeaders;
  jwt: JWTService;
  log: Logger;
  db: DatabaseClient;
  error: (code: number, message: string) => never;
}

// Validation schemas
export const socialAuthBodySchema = t.Object({
  firebaseUid: t.String({ minLength: 1 }),
  email: t.Optional(t.String({ format: "email" })),
  provider: t.String({
    // @ts-expect-error - Elysia enum typing issue
    enum: ["apple", "google"]
  }),
  appleUserId: t.Optional(t.String({ minLength: 1 })),
});
