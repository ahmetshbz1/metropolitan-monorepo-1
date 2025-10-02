//  "api.ts"
//  metropolitan app
//  Created by Ahmet on 08.07.2025.

import axios from "axios";
import { setupInterceptors } from "./api-interceptors";

// Environment variables'dan API URL'sini al
const getApiBaseUrl = (): string => {
  // Environment variable'ı kontrol et
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  console.log("🔧 [ENV DEBUG] EXPO_PUBLIC_API_BASE_URL:", envUrl);
  console.log("🔧 [ENV DEBUG] NODE_ENV:", process.env.NODE_ENV);
  console.log("🔧 [ENV DEBUG] All EXPO_PUBLIC vars:",
    Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC')));

  // Eğer environment variable varsa kullan
  if (envUrl && envUrl.trim() !== '') {
    console.log("🔧 [ENV DEBUG] Using env URL:", envUrl);
    return envUrl;
  }

  // Production için sabit URL kullan
  console.log("🔧 [ENV DEBUG] Using fallback URL: https://api.metropolitanfg.pl");
  return "https://api.metropolitanfg.pl";
};

export const API_BASE_URL = getApiBaseUrl();
const API_URL = `${API_BASE_URL}/api`;

console.log("🔧 [ENV DEBUG] Final API_URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Setup enhanced interceptors with refresh token support and device fingerprinting
setupInterceptors(api);

export { api };
export default api;
