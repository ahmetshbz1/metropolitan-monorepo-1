//  "api.ts"
//  metropolitan app
//  Created by Ahmet on 08.07.2025.

import axios from "axios";
import { setupInterceptors } from "./api-interceptors";

// Environment variables'dan API URL'sini al
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (envUrl) {
    return envUrl;
  }

  // Development fallback (sadece development için)
  if (__DEV__) {
    console.warn("EXPO_PUBLIC_API_BASE_URL not found, using fallback for development");
    return "http://192.168.1.230:3000";
  }

  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL environment variable is required for production"
  );
};

export const API_BASE_URL = getApiBaseUrl();
const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Setup enhanced interceptors with refresh token support and device fingerprinting
setupInterceptors(api);

export { api };
