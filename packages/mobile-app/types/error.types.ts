//  "error.types.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

// Structured error type for API errors
export interface StructuredError extends Error {
  key?: string;
  params?: Record<string, any>;
  code?: string;
}

// API Error response payload
export interface APIErrorPayload {
  key?: string;
  params?: Record<string, any>;
  message?: string;
}

// Axios error with typed response data
export interface APIError {
  response?: {
    data?: APIErrorPayload;
    status?: number;
  };
  message: string;
  code?: string;
}