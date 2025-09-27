//  "api-with-offline.ts"
//  metropolitan app
//  Enhanced API client with offline support

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";
import NetInfo from '@react-native-community/netinfo';
import { offlineCache } from '@/services/offline-cache.service';

// Environment variables'dan API URL'sini al
const getApiBaseUrl = (): string => {
  // Development mode'da local backend kullan
  if (__DEV__) {
    // Önce env'den bak, yoksa local IP kullan
    const devUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (devUrl && devUrl.includes('localhost') || devUrl?.includes('192.168') || devUrl?.includes('10.0')) {
      return devUrl;
    }

    // Local network IP'ni otomatik algıla (Mac/PC'nin local IP'si)
    // Bu IP'yi terminal'de "ifconfig | grep inet" ile bulabilirsin
    // Örnek: 192.168.1.230, 10.0.0.5, vb.
    console.log('[API] Development mode - Using local backend');
    console.log('[API] Update EXPO_PUBLIC_API_BASE_URL in .env.local with your local IP:3000');

    // Development'ta fallback olarak production kullan
    // Ama uyarı ver ki developer local'i ayarlasın
    return "https://api.metropolitanfg.pl";
  }

  // Production mode - her zaman production URL kullan
  console.log('[API] Production mode - Using production backend');
  return "https://api.metropolitanfg.pl";
};

export const API_BASE_URL = getApiBaseUrl();
const API_URL = `${API_BASE_URL}/api`;

// Offline queue for failed requests
interface QueuedRequest {
  id: string;
  config: AxiosRequestConfig;
  timestamp: number;
  retryCount: number;
}

class OfflineAwareApiClient {
  private client: AxiosInstance;
  private offlineQueue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private processingQueue: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000, // 15 seconds timeout
    });

    this.setupInterceptors();
    this.setupNetworkListener();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Check network status
        const netInfo = await NetInfo.fetch();
        this.isOnline = netInfo.isConnected ?? false;

        // Add auth token
        if (!config.headers.Authorization) {
          const token = await SecureStore.getItemAsync("auth_token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request metadata
        config.headers['X-Request-ID'] = `${Date.now()}_${Math.random()}`;
        config.headers['X-App-Version'] = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
        config.headers['X-Platform'] = 'mobile';

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for caching and error handling
    this.client.interceptors.response.use(
      async (response) => {
        // Cache successful GET responses
        if (response.config.method?.toUpperCase() === 'GET' && response.status === 200) {
          await this.cacheResponse(response);
        }

        return response;
      },
      async (error) => {
        // Handle network errors
        if (!error.response && error.code === 'ECONNABORTED') {
          // Timeout error
          return this.handleOfflineRequest(error.config);
        }

        // Handle 401 - Token expired
        if (error.response?.status === 401) {
          await this.handleTokenExpired();
          // Retry original request
          return this.client.request(error.config);
        }

        // Handle server errors with offline fallback
        if (error.response?.status >= 500) {
          return this.handleServerError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        // Connection restored, process offline queue
        this.processOfflineQueue();
      }
    });
  }

  private async cacheResponse(response: AxiosResponse) {
    try {
      const cacheKey = this.getCacheKey(response.config);
      const ttl = this.getCacheTTL(response.config.url || '');

      await offlineCache.set(cacheKey, {
        data: response.data,
        status: response.status,
        headers: response.headers,
      }, ttl);
    } catch (error) {
      // Removed console statement
    }
  }

  private async handleOfflineRequest(config: AxiosRequestConfig) {
    // Check if we have cached data for GET requests
    if (config.method?.toUpperCase() === 'GET') {
      const cachedData = await this.getCachedResponse(config);
      if (cachedData) {
        return {
          ...cachedData,
          config,
          fromCache: true,
        };
      }
    }

    // For non-GET requests or no cache, add to offline queue
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
      this.addToOfflineQueue(config);

      // Return a pending response
      return {
        data: {
          message: 'Request queued for offline processing',
          queued: true
        },
        status: 202, // Accepted
        config,
      };
    }

    // No cache and can't queue
    throw new Error('Network unavailable and no cached data');
  }

  private async getCachedResponse(config: AxiosRequestConfig) {
    try {
      const cacheKey = this.getCacheKey(config);
      return await offlineCache.get(cacheKey);
    } catch (error) {
      // Removed console statement
      return null;
    }
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    return `${config.method}_${url}_${params}`;
  }

  private getCacheTTL(url: string): number {
    // Different TTL for different endpoints
    if (url.includes('/products')) {
      return 1000 * 60 * 60 * 12; // 12 hours for products
    }
    if (url.includes('/users/me')) {
      return 1000 * 60 * 60; // 1 hour for user data
    }
    if (url.includes('/orders')) {
      return 1000 * 60 * 5; // 5 minutes for orders
    }
    return 1000 * 60 * 30; // 30 minutes default
  }

  private addToOfflineQueue(config: AxiosRequestConfig) {
    const queuedRequest: QueuedRequest = {
      id: `${Date.now()}_${Math.random()}`,
      config,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.offlineQueue.push(queuedRequest);

    if (__DEV__) {
      // Removed console statement
    }
  }

  private async processOfflineQueue() {
    if (this.processingQueue || this.offlineQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      const queue = [...this.offlineQueue];
      const failedRequests: QueuedRequest[] = [];

      for (const request of queue) {
        try {
          await this.client.request(request.config);
          // Remove successful request from queue
          this.offlineQueue = this.offlineQueue.filter(r => r.id !== request.id);
        } catch (error) {
          // Increment retry count
          request.retryCount++;

          if (request.retryCount < 3) {
            failedRequests.push(request);
          } else {
            // Removed console statement
          }
        }
      }

      // Update queue with failed requests
      this.offlineQueue = failedRequests;
    } finally {
      this.processingQueue = false;
    }
  }

  private async handleTokenExpired() {
    try {
      // Clear expired token
      await SecureStore.deleteItemAsync("auth_token");

      // Attempt to refresh token if refresh token exists
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      if (refreshToken) {
        // Call refresh endpoint
        const response = await this.client.post('/auth/refresh', {
          refreshToken,
        });

        if (response.data.token) {
          await SecureStore.setItemAsync("auth_token", response.data.token);
        }
      }
    } catch (error) {
      // Removed console statement
      // Redirect to login screen
      // This would be handled by the auth context
    }
  }

  private async handleServerError(error: any) {
    // For 5xx errors, try to return cached data if available
    if (error.config.method?.toUpperCase() === 'GET') {
      const cachedData = await this.getCachedResponse(error.config);
      if (cachedData) {
        // Removed console statement
        return {
          ...cachedData,
          config: error.config,
          fromCache: true,
          stale: true,
        };
      }
    }

    return Promise.reject(error);
  }

  // Public API methods
  async get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put(url, data, config);
  }

  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch(url, data, config);
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    return this.client.delete(url, config);
  }

  // Clear all cached data
  async clearCache() {
    await offlineCache.clear();
  }

  // Get offline queue status
  getOfflineQueueStatus() {
    return {
      count: this.offlineQueue.length,
      isProcessing: this.processingQueue,
      isOnline: this.isOnline,
    };
  }
}

// Export singleton instance
export const apiWithOffline = new OfflineAwareApiClient();

// Also export the original api for backward compatibility
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
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