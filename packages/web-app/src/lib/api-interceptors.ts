// API Interceptors for Web App
// Enhanced API interceptors with refresh token support
// Based on mobile-app's interceptors but adapted for web

import { AxiosInstance } from 'axios';
import { tokenStorage } from './token-storage';
import { getDeviceHeaders } from './device-fingerprint';

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
      console.warn('[API] No refresh token available');
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

      console.log('[API] Token refreshed successfully');
      return newAccessToken;
    }

    console.warn('[API] Token refresh failed - invalid response');
    return null;
  } catch (error: any) {
    console.error('[API] Token refresh failed:', error.response?.data || error.message);

    // If refresh failed with 401, clear tokens and redirect to login
    if (error.response?.status === 401) {
      await tokenStorage.remove();
      // Trigger logout by redirecting to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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
      }

      // Add device fingerprint headers
      const deviceHeaders = await getDeviceHeaders();
      Object.assign(config.headers, deviceHeaders);

      // Override Accept-Language to use simple format that backend expects
      const language = typeof window !== 'undefined'
        ? window.navigator.language?.split('-')[0] || 'tr'
        : 'tr';

      // Ensure language is one of the supported ones
      const supportedLanguages = ['tr', 'en', 'pl'];
      const finalLanguage = supportedLanguages.includes(language) ? language : 'tr';

      config.headers['Accept-Language'] = finalLanguage;

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