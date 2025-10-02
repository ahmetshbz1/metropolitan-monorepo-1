// api-interceptors.ts
// Enhanced API interceptors with refresh token support

import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { tokenStorage } from '../context/auth/storage';
import { getDeviceHeaders } from '../utils/deviceFingerprint';
import i18n from './i18n';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribe to token refresh
 */
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Notify all subscribers when token is refreshed
 */
function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(api: AxiosInstance): Promise<string | null> {
  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      // Removed console statement
      return null;
    }

    // Get device headers for fingerprinting
    const deviceHeaders = await getDeviceHeaders();

    const response = await api.post(
      '/auth/refresh',
      { refreshToken },
      {
        headers: {
          ...deviceHeaders,
          // Don't add Authorization header for refresh endpoint
          'X-Skip-Auth-Interceptor': 'true',
        },
      }
    );

    if (response.data.success && response.data.accessToken) {
      const newAccessToken = response.data.accessToken;

      // Save new access token
      await tokenStorage.saveAccessToken(newAccessToken);

      // If a new refresh token is provided (e.g., after device fingerprint migration), save it too
      if (response.data.refreshToken) {
        await tokenStorage.saveRefreshToken(response.data.refreshToken);
        console.log("🔄 [TOKEN REFRESH] New refresh token received and saved (fingerprint migration)");
      }

      // Removed console statement
      return newAccessToken;
    }

    // Removed console statement
    return null;
  } catch (error: any) {
    // Removed console statement

    // If refresh failed with 401, clear only tokens but keep user data
    if (error.response?.status === 401) {
      // Only clear tokens, keep user data and phone number for re-auth
      await tokenStorage.removeAccessToken();
      await tokenStorage.removeRefreshToken();
      console.log("🔄 [AUTH EXPIRED] Tokens cleared, user needs re-authentication");
    }

    return null;
  }
}

/**
 * Setup request interceptor with device headers and auth token
 */
export function setupRequestInterceptor(api: AxiosInstance) {
  api.interceptors.request.use(
    async (config) => {
      // Skip auth for refresh endpoint
      if (config.headers['X-Skip-Auth-Interceptor']) {
        delete config.headers['X-Skip-Auth-Interceptor'];
        return config;
      }

      // If Authorization header is already set, don't override it
      if (config.headers.Authorization) {
        return config;
      }

      // Get access token
      const token = await tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔧 [API DEBUG] Using token:", token.substring(0, 50) + "...");
      } else {
        console.log("🔧 [API DEBUG] No access token found");
      }

      // Add device fingerprint headers
      const deviceHeaders = await getDeviceHeaders();
      Object.assign(config.headers, deviceHeaders);

      console.log("🔧 [API DEBUG] Request:", config.method?.toUpperCase(), config.url);
      console.log("🔧 [API DEBUG] Base URL:", config.baseURL);
      console.log("🔧 [API DEBUG] Device Headers:", deviceHeaders);

      // Add Accept-Language header for i18n
      config.headers['Accept-Language'] = i18n.language || 'tr';

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}

/**
 * Setup response interceptor with automatic token refresh
 */
export function setupResponseInterceptor(api: AxiosInstance) {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If the error is 401 and we haven't already tried to refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const newToken = await refreshAccessToken(api);
        isRefreshing = false;

        if (newToken) {
          // Notify all queued requests
          onRefreshed(newToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        // If refresh failed, reject all queued requests
        refreshSubscribers = [];
      }

      // Debug error details
      console.log("🔧 [API ERROR] Request failed:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        isNetworkError: !error.response,
        baseURL: error.config?.baseURL,
      });

      if (error.response?.data) {
        console.log("🔧 [API ERROR] Response data:", error.response.data);
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Setup all interceptors for an axios instance
 */
export function setupInterceptors(api: AxiosInstance) {
  setupRequestInterceptor(api);
  setupResponseInterceptor(api);
}