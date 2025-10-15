//  "detailed-performance.middleware.ts"
//  metropolitan backend
//  Extended performance monitoring with per-endpoint tracking

import { Elysia } from "elysia";

import { redis } from "../../database/redis";
import { logger } from "../logger.config";

import { PERFORMANCE_CONFIG } from "./performance-types";

/**
 * Extended performance middleware with detailed endpoint tracking
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
    
    redis.incr(`${endpointKey}:requests`)
      .catch(err => {
        logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to track endpoint requests");
      });

    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS)
      .catch(err => {
        logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to increment active connections");
      });
  })
  .onAfterHandle(({ store, set }) => {
    const responseTime = Date.now() - (store.requestStartTime as number);
    const endpointKey = `endpoint:${store.requestMethod}:${store.requestPath}`;
    
    // Store global metrics
    redis.lpush(
      PERFORMANCE_CONFIG.REDIS_KEYS.API_RESPONSE_TIMES, 
      responseTime.toString()
    )
      .then(() => redis.ltrim(
        PERFORMANCE_CONFIG.REDIS_KEYS.API_RESPONSE_TIMES,
        0,
        999
      ))
      .catch(err => logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to store response time"));

    // Store per-endpoint metrics
    redis.lpush(
      `${endpointKey}:response_times`,
      responseTime.toString()
    )
      .then(() => redis.ltrim(
        `${endpointKey}:response_times`,
        0,
        100
      ))
      .catch(err => logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to store endpoint response time"));

    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_TOTAL_REQUESTS)
      .catch(err => {
        logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to increment total requests");
      });
    
    // Enhanced headers
    set.headers = {
      ...set.headers,
      "X-Response-Time": `${responseTime}ms`,
      "X-Endpoint": `${store.requestMethod} ${store.requestPath}`,
      "X-Performance-Tracked": "detailed",
    };

    redis.decr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS)
      .catch(err => {
        logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to decrement active connections");
      });
  })
  .onError(({ store, error }) => {
    const responseTime = Date.now() - (store.requestStartTime as number);
    const endpointKey = `endpoint:${store.requestMethod}:${store.requestPath}`;

    // Track global and per-endpoint errors
    redis.incr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ERROR_REQUESTS)
      .catch(err => {
        logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to increment error requests");
      });

    redis.incr(`${endpointKey}:errors`)
      .catch(err => {
        logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to increment endpoint errors");
      });

    logger.error(
      { method: store.requestMethod, path: store.requestPath, responseTime, error: error.message },
      "Request failed"
    );

    redis.decr(PERFORMANCE_CONFIG.REDIS_KEYS.API_ACTIVE_CONNECTIONS)
      .catch(err => {
        logger.warn({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to decrement active connections on error");
      });
  });