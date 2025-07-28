// Error handling types for the mobile app

import type { AxiosError } from "axios";
import type { APIError, StructuredError } from "@metropolitan/shared";

// Re-export shared error types
export type { APIError, StructuredError, ErrorCode } from "@metropolitan/shared";

// Helper function to extract error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  // Axios error
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError<APIError>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }
  
  return "An unknown error occurred";
}

// Type guard for Axios errors
export function isAxiosError(error: unknown): error is AxiosError {
  return error !== null && 
         typeof error === "object" && 
         "isAxiosError" in error && 
         (error as any).isAxiosError === true;
}