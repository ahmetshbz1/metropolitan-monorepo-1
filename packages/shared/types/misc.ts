// "misc.ts"
// metropolitan app
// Created by Ahmet on 15.07.2025.
/**
 * Generic API response wrapper used by most endpoints.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NipResponse {
  companyName: string;
  nip: string;
  statusVat: string;
  regon: string;
  krs: string;
  workingAddress: string;
  registrationDate: string;
}

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  requestId?: string;
}

export interface RequestContext {
  requestId: string;
}
