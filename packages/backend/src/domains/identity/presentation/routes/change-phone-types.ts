// change-phone-types.ts
// Type definitions and validation schemas for phone change endpoints

import { t } from "elysia";

// Request type definitions
export interface VerifyCurrentPhoneRequest {
  currentPhone: string;
}

export interface SendOtpRequest {
  sessionId: string;
  newPhone: string;
}

export interface VerifyNewPhoneRequest {
  currentSessionId: string;
  newSessionId: string;
  otp: string;
}

export interface ResendOtpRequest {
  sessionId: string;
  phone: string;
}

// Response type definitions
export interface VerifyCurrentPhoneResponse {
  success: boolean;
  sessionId?: string;
  message: string;
}

export interface SendOtpResponse {
  success: boolean;
  sessionId?: string;
  message: string;
}

export interface VerifyNewPhoneResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
}

// Validation schemas
export const verifyCurrentPhoneSchema = t.Object({
  currentPhone: t.String(),
});

export const sendOtpSchema = t.Object({
  sessionId: t.String(),
  newPhone: t.String(),
});

export const verifyNewPhoneSchema = t.Object({
  currentSessionId: t.String(),
  newSessionId: t.String(),
  otp: t.String(),
});

export const resendOtpSchema = t.Object({
  sessionId: t.String(),
  phone: t.String(),
});
