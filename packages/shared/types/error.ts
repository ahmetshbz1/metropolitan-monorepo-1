//  "error.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

/**
 * Structured error type for consistent error handling across the application.
 * Supports localization through key/params pattern.
 */
export interface StructuredError extends Error {
  /** Error key for localization (e.g., "auth.invalid_otp") */
  key?: string;
  /** Parameters for error message interpolation */
  params?: Record<string, any>;
  /** Error code for categorization (e.g., "VALIDATION_ERROR", "AUTH_ERROR") */
  code?: string;
}

/**
 * API error response payload structure.
 * Used for consistent error responses from the backend.
 */
export interface APIErrorPayload {
  /** Error key for localization */
  key?: string;
  /** Parameters for error message interpolation */
  params?: Record<string, any>;
  /** Human-readable error message (fallback when key is not available) */
  message?: string;
}

/**
 * Axios/Fetch error with typed response data.
 * Represents HTTP errors with structured error payloads.
 */
export interface APIError {
  /** HTTP response details */
  response?: {
    /** Structured error data from the API */
    data?: APIErrorPayload;
    /** HTTP status code */
    status?: number;
  };
  /** Error message */
  message: string;
  /** Error code (e.g., "ECONNREFUSED", "TIMEOUT") */
  code?: string;
}

/**
 * Helper type guard to check if an error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as APIError).message === "string"
  );
}

/**
 * Helper type guard to check if an error is a StructuredError
 */
export function isStructuredError(error: unknown): error is StructuredError {
  return (
    error instanceof Error &&
    ("key" in error || "code" in error || "params" in error)
  );
}

/**
 * Common error codes used across the application
 */
export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",
  
  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  
  // Business logic errors
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  ORDER_NOT_FOUND = "ORDER_NOT_FOUND",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  
  // Server errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}