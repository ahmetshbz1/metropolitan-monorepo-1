// API Interceptors for Web App
// Enhanced API interceptors with refresh token support
// Based on mobile-app's interceptors but adapted for web

import { AxiosInstance } from 'axios';
import { getDeviceHeaders, extractSessionIdFromToken, saveSessionId, clearSessionId } from './device-fingerprint';
import { useAuthStore } from '@/stores/auth-store';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let failedRefreshSubscribers: (() => void)[] = [];

/**
 * Subscribe to token refresh
 */
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Subscribe to failed refresh
 */
function subscribeFailedRefresh(cb: () => void) {
  failedRefreshSubscribers.push(cb);
}

/**
 * Notify all subscribers when token is refreshed
 */
function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Notify all subscribers when refresh failed
 */
function onRefreshFailed() {
  failedRefreshSubscribers.forEach(cb => cb());
  failedRefreshSubscribers = [];
  refreshSubscribers = [];
}

/**
 * Clear all auth data and redirect to login
 */
async function clearAuthAndRedirect() {
  // Clear Zustand store (this also clears localStorage)
  if (typeof window !== 'undefined') {
    try {
      useAuthStore.getState().clearAuth();
      clearSessionId(); // Clear session ID from sessionStorage

      // Redirect to login page
      window.location.href = '/auth/phone-login';
    } catch (error) {
      console.error('[API] Error clearing auth:', error);
    }
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(api: AxiosInstance): Promise<string | null> {
  try {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      await clearAuthAndRedirect();
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

      // Save new access token to Zustand (this also saves to localStorage)
      useAuthStore.getState().setTokens(newAccessToken, refreshToken);

      // Extract and save session ID from token
      const sessionId = extractSessionIdFromToken(newAccessToken);
      if (sessionId) {
        saveSessionId(sessionId);
      }

      return newAccessToken;
    }

    await clearAuthAndRedirect();
    return null;
  } catch (error: any) {
    console.error('[API] Token refresh failed:', error.response?.data || error.message);

    // Clear auth and redirect on any refresh error
    await clearAuthAndRedirect();
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

      // Get access token from Zustand
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        // Ensure session ID is saved (only if not already in sessionStorage)
        if (typeof window !== 'undefined') {
          try {
            const existingSessionId = sessionStorage.getItem('metropolitan_session_id');
            if (!existingSessionId) {
              const sessionId = extractSessionIdFromToken(token);
              if (sessionId) {
                saveSessionId(sessionId);
              }
            }
          } catch (error) {
            // Ignore session storage errors
          }
        }
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

      // Skip refresh for auth endpoints (except refresh endpoint itself)
      if (originalRequest.url?.includes('/auth/') && !originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      // Check for user not found scenarios (session invalid but token still valid)
      const isUserNotFound = 
        error.response?.status === 401 ||
        error.response?.data?.code === "USER_NOT_FOUND" ||
        error.response?.data?.message === "User not found";

      if (isUserNotFound && !originalRequest._sessionExpiredHandled) {
        // Mark this request as handled to prevent infinite loops
        originalRequest._sessionExpiredHandled = true;

        // Clear auth and redirect to login
        await clearAuthAndRedirect();

        return Promise.reject(error);
      }

      // If the error is 401 and we haven't already tried to refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Check if we have a refresh token before attempting refresh
        const hasRefreshToken = useAuthStore.getState().refreshToken;
        if (!hasRefreshToken) {
          return Promise.reject(error);
        }
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
            subscribeFailedRefresh(() => {
              reject(error);
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
        } else {
          // Notify all queued requests that refresh failed
          onRefreshFailed();
        }
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