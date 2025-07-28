//  "performance-middleware.ts"
//  metropolitan backend  
//  Focused Elysia middleware for request tracking and performance monitoring
//  Extracted from performance-monitor.ts (lines 343-375)

import { Elysia } from "elysia";
import { redis } from "../../database/redis";
import { PERFORMANCE_CONFIG } from "./performance-types";

/**
 * Performance monitoring middleware for Elysia
 * Tracks request metrics, response times, and error rates
 */
export const performanceMiddleware = new Elysia()
  .state('requestStartTime', 0)
  .onBeforeHandle(({ request, set, store }) => {
    // Track request start time
    store.requestStartTime = Date.now();
    
    // Increment active connections counter
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS).catch(err => {
      console.warn('Failed to increment active connections:', err);
    });
  })
  .onAfterHandle(({ store, set }) => {
    // Calculate response time
    const responseTime = Date.now() - (store.requestStartTime as number);
    
    // Store response time for metrics collection
    redis.lpush(PERFORMANCE_CONFIG.REDIS_KEYS.API_RESPONSE_TIMES, responseTime.toString())
      .then(() => {
        // Keep only last 1000 response times
        return redis.ltrim(PERFORMANCE_CONFIG.REDIS_KEYS.API_RESPONSE_TIMES, 0, 999);
      })
      .catch(err => {
        console.warn('Failed to store response time:', err);
      });
    
    // Increment total request counter
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_TOTAL_REQUESTS).catch(err => {
      console.warn('Failed to increment total requests:', err);
    });
    
    // Add performance headers for client visibility
    set.headers = {
      ...set.headers,
      "X-Response-Time": `${responseTime}ms`,
      "X-Performance-Tracked": "true",
    };
    
    // Decrement active connections counter
    redis.decr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS).catch(err => {
      console.warn('Failed to decrement active connections:', err);
    });
  })
  .onError(({ store, error }) => {
    // Increment error request counter
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ERROR_REQUESTS).catch(err => {
      console.warn('Failed to increment error requests:', err);
    });
    
    // Log performance impact of error
    const responseTime = Date.now() - (store.requestStartTime as number);
    console.error(`Request failed after ${responseTime}ms:`, error.message);
    
    // Decrement active connections counter on error
    redis.decr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS).catch(err => {
      console.warn('Failed to decrement active connections on error:', err);
    });
  });

/**
 * Extended performance middleware with more detailed tracking
 */
export const detailedPerformanceMiddleware = new Elysia()
  .state('requestStartTime', 0)
  .state('requestPath', '')
  .state('requestMethod', '')
  .onBeforeHandle(({ request, set, store }) => {
    // Track detailed request information
    store.requestStartTime = Date.now();
    store.requestPath = new URL(request.url).pathname;
    store.requestMethod = request.method;
    
    // Track per-endpoint metrics
    const endpointKey = `endpoint:${request.method}:${store.requestPath}`;
    
    redis.incr(`${endpointKey}:requests`).catch(err => {
      console.warn('Failed to track endpoint requests:', err);
    });
    
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS).catch(err => {
      console.warn('Failed to increment active connections:', err);
    });
  })
  .onAfterHandle(({ store, set }) => {
    const responseTime = Date.now() - (store.requestStartTime as number);
    const endpointKey = `endpoint:${store.requestMethod}:${store.requestPath}`;
    
    // Store global metrics
    redis.lpush(PERFORMANCE_CONFIG.REDIS_KEYS.API_RESPONSE_TIMES, responseTime.toString())
      .then(() => redis.ltrim(PERFORMANCE_CONFIG.REDIS_KEYS.API_RESPONSE_TIMES, 0, 999))
      .catch(err => console.warn('Failed to store response time:', err));
    
    // Store per-endpoint metrics
    redis.lpush(`${endpointKey}:response_times`, responseTime.toString())
      .then(() => redis.ltrim(`${endpointKey}:response_times`, 0, 100))
      .catch(err => console.warn('Failed to store endpoint response time:', err));
    
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_TOTAL_REQUESTS).catch(err => {
      console.warn('Failed to increment total requests:', err);
    });
    
    // Enhanced headers
    set.headers = {
      ...set.headers,
      "X-Response-Time": `${responseTime}ms`,
      "X-Endpoint": `${store.requestMethod} ${store.requestPath}`,
      "X-Performance-Tracked": "detailed",
    };
    
    redis.decr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS).catch(err => {
      console.warn('Failed to decrement active connections:', err);
    });
  })
  .onError(({ store, error }) => {
    const responseTime = Date.now() - (store.requestStartTime as number);
    const endpointKey = `endpoint:${store.requestMethod}:${store.requestPath}`;
    
    // Track global and per-endpoint errors
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ERROR_REQUESTS).catch(err => {
      console.warn('Failed to increment error requests:', err);
    });
    
    redis.incr(`${endpointKey}:errors`).catch(err => {
      console.warn('Failed to increment endpoint errors:', err);
    });
    
    console.error(`${store.requestMethod} ${store.requestPath} failed after ${responseTime}ms:`, error.message);
    
    redis.decr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS).catch(err => {
      console.warn('Failed to decrement active connections on error:', err);
    });
  });

/**
 * Utility functions for performance middleware
 */
export class PerformanceMiddlewareUtils {
  /**
   * Get endpoint-specific metrics
   */
  static async getEndpointMetrics(method: string, path: string): Promise<{
    requests: number;
    errors: number;
    avgResponseTime: number;
    errorRate: number;
  }> {
    const endpointKey = `endpoint:${method}:${path}`;
    
    try {
      const [requests, errors, responseTimes] = await Promise.all([
        redis.get(`${endpointKey}:requests`),
        redis.get(`${endpointKey}:errors`),
        redis.lrange(`${endpointKey}:response_times`, 0, -1),
      ]);
      
      const requestCount = parseInt(requests || '0');
      const errorCount = parseInt(errors || '0');
      const responseTimeNumbers = responseTimes.map(t => parseFloat(t)).filter(t => !isNaN(t));
      
      const avgResponseTime = responseTimeNumbers.length > 0
        ? responseTimeNumbers.reduce((a, b) => a + b, 0) / responseTimeNumbers.length
        : 0;
      
      const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
      
      return {
        requests: requestCount,
        errors: errorCount,
        avgResponseTime,
        errorRate,
      };
    } catch (error) {
      console.error('Failed to get endpoint metrics:', error);
      return {
        requests: 0,
        errors: 0,
        avgResponseTime: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Clear endpoint-specific metrics
   */
  static async clearEndpointMetrics(method: string, path: string): Promise<void> {
    const endpointKey = `endpoint:${method}:${path}`;
    
    try {
      await redis.del(
        `${endpointKey}:requests`,
        `${endpointKey}:errors`,
        `${endpointKey}:response_times`
      );
    } catch (error) {
      console.error('Failed to clear endpoint metrics:', error);
    }
  }

  /**
   * Get all tracked endpoints
   */
  static async getTrackedEndpoints(): Promise<string[]> {
    try {
      const keys = await redis.keys('endpoint:*:requests');
      return keys.map(key => {
        // Extract method and path from key like "endpoint:GET:/api/users:requests"
        const parts = key.split(':');
        if (parts.length >= 4) {
          return `${parts[1]} ${parts.slice(2, -1).join(':')}`;
        }
        return key;
      });
    } catch (error) {
      console.error('Failed to get tracked endpoints:', error);
      return [];
    }
  }
}