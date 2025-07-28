//  "useOptimizedAPI.ts"
//  metropolitan app
//  Optimized API hook with request batching and caching

import { useCallback, useRef, useState } from "react";
import { api } from "@/core/api";
import { AxiosRequestConfig } from "axios";

interface RequestOptions extends AxiosRequestConfig {
  cacheTime?: number; // Cache duration in ms
  staleTime?: number; // Time before cache is considered stale
  retry?: number; // Number of retries
  retryDelay?: number; // Delay between retries in ms
  batch?: boolean; // Enable request batching
  priority?: "high" | "normal" | "low"; // Request priority
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTimestamp: number;
}

// Global cache and request queue
const cache = new Map<string, CacheEntry<any>>();
const requestQueue = new Map<string, Promise<any>>();
const batchQueue = new Map<string, { resolve: Function; reject: Function; options: RequestOptions }[]>();

// Request batching configuration
const BATCH_INTERVAL = 10; // ms
const MAX_BATCH_SIZE = 10;
let batchTimer: NodeJS.Timeout | null = null;

// Process batched requests
const processBatchQueue = async () => {
  if (batchQueue.size === 0) return;
  
  const batches = Array.from(batchQueue.entries());
  batchQueue.clear();
  
  // Group by endpoint for efficient batching
  const groupedBatches = new Map<string, typeof batches[0][1]>();
  
  batches.forEach(([key, requests]) => {
    const endpoint = key.split("?")[0]; // Extract base endpoint
    if (!groupedBatches.has(endpoint)) {
      groupedBatches.set(endpoint, []);
    }
    groupedBatches.get(endpoint)!.push(...requests);
  });
  
  // Process each group
  for (const [endpoint, requests] of groupedBatches) {
    try {
      // Create batch request
      const batchData = requests.map((req, index) => ({
        id: index,
        ...req.options,
      }));
      
      // Send batch request
      const response = await api.post(`${endpoint}/batch`, { requests: batchData });
      
      // Resolve individual requests
      requests.forEach((req, index) => {
        const result = response.data.results[index];
        if (result.error) {
          req.reject(result.error);
        } else {
          req.resolve(result.data);
        }
      });
    } catch (error) {
      // Fallback to individual requests on batch failure
      for (const req of requests) {
        try {
          const response = await api.request(req.options);
          req.resolve(response.data);
        } catch (err) {
          req.reject(err);
        }
      }
    }
  }
};

// Schedule batch processing
const scheduleBatch = () => {
  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(processBatchQueue, BATCH_INTERVAL);
};

export function useOptimizedAPI<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController>();
  
  // Cancel ongoing requests on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const request = useCallback(async (
    url: string,
    options: RequestOptions = {}
  ): Promise<T> => {
    const {
      cacheTime = 5 * 60 * 1000, // 5 minutes default
      staleTime = 60 * 1000, // 1 minute default
      retry = 3,
      retryDelay = 1000,
      batch = false,
      priority = "normal",
      ...axiosOptions
    } = options;
    
    const cacheKey = `${url}:${JSON.stringify(axiosOptions.params || {})}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      const now = Date.now();
      
      // Return fresh cache
      if (now < cached.timestamp + cacheTime) {
        // If stale, refresh in background
        if (now > cached.staleTimestamp) {
          refreshInBackground(url, options);
        }
        return cached.data;
      }
    }
    
    // Check if request is already in flight
    const inFlight = requestQueue.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
    
    // Handle batching
    if (batch && options.method === "GET") {
      return new Promise((resolve, reject) => {
        if (!batchQueue.has(cacheKey)) {
          batchQueue.set(cacheKey, []);
        }
        batchQueue.get(cacheKey)!.push({ resolve, reject, options: { url, ...axiosOptions } });
        
        // Process immediately if batch is full
        if (batchQueue.get(cacheKey)!.length >= MAX_BATCH_SIZE) {
          processBatchQueue();
        } else {
          scheduleBatch();
        }
      });
    }
    
    // Create new request with retry logic
    const makeRequest = async (attemptCount = 0): Promise<T> => {
      try {
        setLoading(true);
        setError(null);
        
        // Create abort controller
        abortControllerRef.current = new AbortController();
        
        // Add request priority header
        const headers = {
          ...axiosOptions.headers,
          "X-Priority": priority,
        };
        
        const response = await api.request<T>({
          url,
          ...axiosOptions,
          headers,
          signal: abortControllerRef.current.signal,
        });
        
        // Cache successful response
        const now = Date.now();
        cache.set(cacheKey, {
          data: response.data,
          timestamp: now,
          staleTimestamp: now + staleTime,
        });
        
        return response.data;
      } catch (err: any) {
        // Retry logic
        if (attemptCount < retry - 1 && !err.message?.includes("aborted")) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attemptCount + 1)));
          return makeRequest(attemptCount + 1);
        }
        
        setError(err);
        throw err;
      } finally {
        setLoading(false);
        requestQueue.delete(cacheKey);
      }
    };
    
    // Store request promise to prevent duplicates
    const requestPromise = makeRequest();
    requestQueue.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, []);
  
  // Refresh data in background
  const refreshInBackground = useCallback(async (url: string, options: RequestOptions) => {
    try {
      const response = await api.request({ url, ...options });
      const cacheKey = `${url}:${JSON.stringify(options.params || {})}`;
      const now = Date.now();
      
      cache.set(cacheKey, {
        data: response.data,
        timestamp: now,
        staleTimestamp: now + (options.staleTime || 60000),
      });
    } catch (error) {
      console.warn("Background refresh failed:", error);
    }
  }, []);
  
  // Prefetch data
  const prefetch = useCallback(async (url: string, options: RequestOptions = {}) => {
    const cacheKey = `${url}:${JSON.stringify(options.params || {})}`;
    
    // Skip if already cached
    if (cache.has(cacheKey)) return;
    
    try {
      await request(url, { ...options, priority: "low" });
    } catch (error) {
      // Silently fail for prefetch
      console.warn("Prefetch failed:", error);
    }
  }, [request]);
  
  // Invalidate cache
  const invalidate = useCallback((pattern?: string) => {
    if (pattern) {
      // Invalidate matching keys
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      cache.clear();
    }
  }, []);
  
  return {
    request,
    prefetch,
    invalidate,
    loading,
    error,
    // Cache statistics
    getCacheStats: () => ({
      size: cache.size,
      keys: Array.from(cache.keys()),
    }),
  };
}

// Global request interceptor for performance monitoring
api.interceptors.request.use((config) => {
  // Add request timestamp
  config.metadata = { startTime: Date.now() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Log slow requests
    const duration = Date.now() - response.config.metadata?.startTime;
    if (duration > 1000) {
      console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  (error) => {
    // Log failed requests
    const duration = Date.now() - error.config?.metadata?.startTime;
    console.error(`API request failed: ${error.config?.url} after ${duration}ms`);
    return Promise.reject(error);
  }
);