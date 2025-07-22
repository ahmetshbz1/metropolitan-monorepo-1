//  "api.ts"
//  metropolitan app
//  Created by Ahmet on 08.07.2025.

import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Environment variables'dan API URL'sini al
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (envUrl) {
    return envUrl;
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

api.interceptors.request.use(
  async (config) => {
    // If the Authorization header is already set, don't override it.
    // This allows request-specific tokens (like registrationToken) to be used.
    if (config.headers.Authorization) {
      return config;
    }

    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api };
