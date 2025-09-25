import { cors } from '@elysiajs/cors';
import { envConfig } from '../config/env.config';
import { Elysia } from 'elysia';

/**
 * CORS configuration for the application
 * Configures Cross-Origin Resource Sharing policies
 */
export const corsConfig = () => {
  const isDevelopment = envConfig.NODE_ENV === 'development';
  const isTest = envConfig.NODE_ENV === 'test';

  // Allowed origins based on environment
  const getAllowedOrigins = () => {
    if (isDevelopment || isTest) {
      // In development, allow all origins
      return true;
    }

    // Production allowed origins
    const origins = [
      'https://metropolitan.com',
      'https://www.metropolitan.com',
      'https://app.metropolitan.com',
      'https://admin.metropolitan.com',
    ];

    // Add any additional origins from environment variables
    if (envConfig.ALLOWED_ORIGINS) {
      const additionalOrigins = envConfig.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
      origins.push(...additionalOrigins);
    }

    return origins;
  };

  return cors({
    origin: getAllowedOrigins(),
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Device-ID',
      'X-App-Version',
      'X-Platform',
      'Accept',
      'Accept-Language',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    maxAge: 86400, // 24 hours cache for preflight requests
    exposeHeaders: [
      'X-Request-ID',
      'X-Response-Time',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    preflight: true,
  });
};

/**
 * Security headers middleware
 * Adds additional security headers to responses
 */
export const securityHeaders = () => new Elysia({ name: 'securityHeaders' }).onBeforeHandle(({ set }) => {
    // Security headers for all responses
    set.headers['X-Content-Type-Options'] = 'nosniff';
    set.headers['X-Frame-Options'] = 'DENY';
    set.headers['X-XSS-Protection'] = '1; mode=block';
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

    // Content Security Policy for production
    if (envConfig.NODE_ENV === 'production') {
      set.headers['Content-Security-Policy'] =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://api.stripe.com https://*.sentry.io wss:; " +
        "frame-ancestors 'none'; " +
        "object-src 'none'; " +
        "media-src 'self'; " +
        "frame-src 'none';";

      // Strict Transport Security (2 years + subdomains + preload)
      set.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';

      // Permissions Policy (disable unnecessary features)
      set.headers['Permissions-Policy'] =
        'geolocation=(), microphone=(), camera=(), payment=(self), usb=()';
    }

    // Additional security headers for all environments
    set.headers['X-Download-Options'] = 'noopen';
    set.headers['X-Permitted-Cross-Domain-Policies'] = 'none';
});