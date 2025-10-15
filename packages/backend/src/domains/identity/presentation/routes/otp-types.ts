// "otp-types.ts"
// metropolitan backend
// Type definitions and validation schemas for OTP operations

import { t } from "elysia";
import type { Logger } from "@bogeychan/elysia-logger";
import type { JWTPayloadSpec } from "@elysiajs/jwt";

import { phoneNumberSchema, userTypeEnum } from "./auth-guards";

// Request body types
export interface SendOtpBody {
  phoneNumber: string;
  userType: string;
}

export interface VerifyOtpBody {
  phoneNumber: string;
  otpCode: string;
  userType: string;
  firebaseUid?: string;
  provider?: "apple" | "google";
  email?: string;
  appleUserId?: string;
}

// Response types
export interface SendOtpSuccessResponse {
  success: true;
  message: string;
  isNewUser: boolean;
  needsProfileCompletion: boolean;
}

export interface SendOtpErrorResponse {
  success: false;
  message: string;
}

export type SendOtpResponse = SendOtpSuccessResponse | SendOtpErrorResponse;

export interface VerifyOtpSuccessResponse {
  success: true;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  registrationToken?: string;
}

export interface VerifyOtpErrorResponse {
  success: false;
  message: string;
}

export type VerifyOtpResponse =
  | VerifyOtpSuccessResponse
  | VerifyOtpErrorResponse;

// Header types
export interface OtpHeaders {
  "accept-language"?: string;
  "user-agent"?: string;
  "x-platform"?: string;
  "x-device-model"?: string;
  "x-timezone"?: string;
  "x-forwarded-for"?: string;
  "x-real-ip"?: string;
  [key: string]: string | undefined;
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

// Database types
export interface UserRecord {
  id: string;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  userType: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  firebaseUid?: string | null;
  authProvider?: string | null;
  appleUserId?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// User check result
export interface UserCheckResult {
  existingUser: UserRecord | undefined;
  isRegisteredUser: boolean;
  hasCompleteProfile: boolean;
  needsRegistration: boolean;
}

// Validation schemas
export const sendOtpBodySchema = t.Object({
  phoneNumber: t.String(phoneNumberSchema),
  userType: t.String({ enum: userTypeEnum }),
});

export const verifyOtpBodySchema = t.Object({
  phoneNumber: t.String(phoneNumberSchema),
  otpCode: t.String({ minLength: 6, maxLength: 6 }),
  userType: t.String({ enum: userTypeEnum }),
  firebaseUid: t.Optional(t.String()),
  provider: t.Optional(t.String({ enum: ["apple", "google"] })),
  email: t.Optional(t.String({ format: "email" })),
  appleUserId: t.Optional(t.String()),
});
