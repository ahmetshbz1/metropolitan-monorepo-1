import { Elysia } from "elysia";

import { envConfig } from "../config/env.config";
import { redis } from "../database/redis";
import { logger } from "../monitoring/logger.config";


type RequestHeaders = Record<string, string | undefined>;

interface ClientIdentifierContext {
  request: Request;
  headers: RequestHeaders;
}

interface RateLimiterContext extends ClientIdentifierContext {
  path: string;
}

export interface RateLimitConfig {
  max: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (context: RateLimiterContext) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean; // Skip successful requests from rate limiting
  skipFailedRequests?: boolean; // Skip failed requests from rate limiting
  message?: string; // Custom message when rate limit is exceeded
  standardHeaders?: boolean; // Return rate limit info in headers
  legacyHeaders?: boolean; // Return rate limit info in legacy headers
}

// Different rate limit configurations for different endpoints
export const rateLimitConfigs = {
  // Default configuration
  default: {
    max: 100,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests, please try again later.",
  },
  // Strict limit for authentication endpoints
  auth: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many authentication attempts. Please try again later.",
  },
  // OTP send endpoints - prevent SMS bombing
  otpSend: {
    max: 3,
    windowMs: 60 * 1000, // 1 minute - max 3 OTP per minute
    message: "Too many OTP requests. Please wait 1 minute before trying again.",
  },
  // OTP verify endpoints - prevent brute force
  otpVerify: {
    max: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes - max 3 attempts
    message: "Too many verification attempts. Please wait 5 minutes.",
  },
  // Refresh token endpoint
  refreshToken: {
    max: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes - 10 refresh attempts
    message: "Too many token refresh attempts. Please try again later.",
  },
  // Order creation
  orderCreation: {
    max: 10,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many order requests. Please slow down.",
  },
  // Data export (GDPR)
  dataExport: {
    max: 2,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    message: "Data export limit reached. Please try again tomorrow.",
  },
  // Search endpoints
  search: {
    max: 30,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many search requests. Please slow down.",
  },
  // Webhook endpoints (should be generous for external services)
  webhook: {
    max: 1000,
    windowMs: 60 * 1000, // 1 minute
    message: "Webhook rate limit exceeded.",
  }
};

/**
 * Creates a rate limit middleware for Elysia
 */
export const createRateLimiter = (config: RateLimitConfig = rateLimitConfigs.default) => {
  return new Elysia()
    .onBeforeHandle(async ({ request, headers, set, path }) => {
      const headerRecord = headers as RequestHeaders;
      const rateLimiterContext: RateLimiterContext = { request, headers: headerRecord, path };
      const clientIdentifier = config.keyGenerator
        ? config.keyGenerator(rateLimiterContext)
        : getClientIdentifier(rateLimiterContext);
      // Skip rate limiting for health check endpoints
      if (path.includes('/health')) {
        return;
      }

      // Skip in test environment
      if (envConfig.NODE_ENV === 'test') {
        return;
      }

      const key = `rate_limit:${clientIdentifier}:${path}`;
      const now = Date.now();
      const window = config.windowMs;
      const max = config.max;

      try {
        // Get current count from Redis
        const currentCount = await redis.get(key);
        const count = currentCount ? parseInt(currentCount as string) : 0;

        if (count >= max) {
          // Rate limit exceeded
          logger.warn("Rate limit exceeded", {
            clientIdentifier,
            path,
            count,
            max,
          });

          // Set rate limit headers
          if (config.standardHeaders !== false) {
            set.headers['X-RateLimit-Limit'] = String(max);
            set.headers['X-RateLimit-Remaining'] = '0';
            set.headers['X-RateLimit-Reset'] = new Date(now + window).toISOString();
          }

          if (config.legacyHeaders !== false) {
            set.headers['X-Rate-Limit-Limit'] = String(max);
            set.headers['X-Rate-Limit-Remaining'] = '0';
            set.headers['X-Rate-Limit-Reset'] = String(Math.ceil((now + window) / 1000));
          }

          // Set Retry-After header
          set.headers['Retry-After'] = String(Math.ceil(window / 1000));

          set.status = 429;
          return {
            success: false,
            error: config.message || rateLimitConfigs.default.message,
            retryAfter: Math.ceil(window / 1000),
          };
        }

        // Increment counter
        if (count === 0) {
          // First request in the window
          await redis.set(key, '1', 'PX', window);
        } else {
          // Increment existing counter
          await redis.incr(key);
        }

        // Set rate limit headers
        if (config.standardHeaders !== false) {
          set.headers['X-RateLimit-Limit'] = String(max);
          set.headers['X-RateLimit-Remaining'] = String(max - count - 1);
          set.headers['X-RateLimit-Reset'] = new Date(now + window).toISOString();
        }

        if (config.legacyHeaders !== false) {
          set.headers['X-Rate-Limit-Limit'] = String(max);
          set.headers['X-Rate-Limit-Remaining'] = String(max - count - 1);
          set.headers['X-Rate-Limit-Reset'] = String(Math.ceil((now + window) / 1000));
        }
      } catch (error) {
        // If Redis is down, log the error but don't block the request
        logger.error("Rate limiting failed, allowing request", error instanceof Error ? error : undefined, {
          key,
          details: error instanceof Error ? undefined : error,
        });
        // Continue without rate limiting if Redis fails
      }
    });
};

/**
 * Gets client identifier for rate limiting
 * Uses IP address, user ID, or API key
 */
function getClientIdentifier({ request, headers }: ClientIdentifierContext): string {
  // Try to get user ID from JWT (if authenticated)
  const authHeader = headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    // Extract user ID from token if needed
    // For now, we'll use the token itself as identifier
    return `auth:${authHeader.substring(7, 27)}`; // Use first 20 chars of token
  }

  // Try to get real IP (considering proxy headers)
  const forwardedFor = headers['x-forwarded-for'];
  const realIp = headers['x-real-ip'];
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || request.headers.get('cf-connecting-ip');

  if (clientIp) {
    return `ip:${clientIp}`;
  }

  // Fallback to a generic identifier (not ideal but prevents errors)
  return 'anonymous';
}

/**
 * Apply different rate limits to different route groups
 */
export const applyRateLimiting = (app: Elysia) => {
  // Apply default rate limiting globally
  app.use(createRateLimiter(rateLimitConfigs.default));

  // You can also apply specific rate limits to specific routes
  // This would be done in the route definitions themselves
  return app;
};