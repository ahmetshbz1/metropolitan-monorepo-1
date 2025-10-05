//  "api.ts"
//  metropolitan app
//  Created by Ahmet on 08.07.2025.

import axios from "axios";
import { setupInterceptors } from "./api-interceptors";

// Environment variables'dan API URL'sini al
const getApiBaseUrl = (): string => {
  // Environment variable'ı kontrol et
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Eğer environment variable varsa kullan
  if (envUrl && envUrl.trim() !== "") {
    return envUrl;
  }

  // Production için sabit URL kullan
  return "https://api.metropolitanfg.pl";
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
export default api;
