//  "basic-performance.middleware.ts"
//  metropolitan backend  
//  Basic performance monitoring middleware

import { Elysia } from "elysia";
import { redis } from "../../database/redis";
import { PERFORMANCE_CONFIG } from "./performance-types";

/**
 * Basic performance monitoring middleware for Elysia
 * Tracks request counts, response times, and errors
 */
export const basicPerformanceMiddleware = new Elysia()
  .state('requestStartTime', 0)
  .onBeforeHandle(({ request, set, store }) => {
    // Track request start time
    store.requestStartTime = Date.now();
    
    // Increment active connections counter
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS)
      .catch(err => {
        console.warn('Failed to increment active connections:', err);
      });
  })
  .onAfterHandle(({ store, set }) => {
    // Calculate response time
    const responseTime = Date.now() - (store.requestStartTime as number);
    
    // Store response time for metrics
    redis.lpush(
      PERFORMANCE_CONFIG.REDIS_KEYS.API_RESPONSE_TIMES, 
      responseTime.toString()
    )
      .then(() => {
        // Keep only last 1000 response times
        return redis.ltrim(
          PERFORMANCE_CONFIG.REDIS_KEYS.API_RESPONSE_TIMES, 
          0, 
          999
        );
      })
      .catch(err => {
        console.warn('Failed to store response time:', err);
      });
    
    // Increment total request counter
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_TOTAL_REQUESTS)
      .catch(err => {
        console.warn('Failed to increment total requests:', err);
      });
    
    // Add performance headers
    set.headers = {
      ...set.headers,
      "X-Response-Time": `${responseTime}ms`,
      "X-Performance-Tracked": "true",
    };
    
    // Decrement active connections
    redis.decr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS)
      .catch(err => {
        console.warn('Failed to decrement active connections:', err);
      });
  })
  .onError(({ store, error }) => {
    // Increment error counter
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ERROR_REQUESTS)
      .catch(err => {
        console.warn('Failed to increment error requests:', err);
      });
    
    // Log performance impact of error
    const responseTime = Date.now() - (store.requestStartTime as number);
    console.error(`Request failed after ${responseTime}ms:`, error.message);
    
    // Decrement active connections on error
    redis.decr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS)
      .catch(err => {
        console.warn('Failed to decrement active connections on error:', err);
      });
  });