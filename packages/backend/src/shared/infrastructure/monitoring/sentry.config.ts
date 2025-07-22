//  "sentry.config.ts"
//  metropolitan backend
//  Created by Ahmet on 05.06.2025.

import * as Sentry from "@sentry/node";
export function initializeSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn(
      "⚠️  SENTRY_DSN environment variable not set. Sentry monitoring disabled."
    );
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Performance monitoring
    integrations: [
      // Postgres monitoring
      Sentry.postgresIntegration(),
      // HTTP monitoring
      Sentry.httpIntegration(),
      // Node.js monitoring
      Sentry.nodeContextIntegration(),
      Sentry.localVariablesIntegration(),
    ],

    // Filter out health check requests
    beforeSend(event) {
      // Health check requests'leri ignore et
      if (event.request?.url?.includes("/health")) {
        return null;
      }
      return event;
    },

    // Add custom tags
    initialScope: {
      tags: {
        component: "metropolitan-backend",
        architecture: "ddd",
      },
    },
  });

  console.log("✅ Sentry monitoring initialized");
}

// Error helper functions
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    tags: context,
  });
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info"
) => {
  Sentry.captureMessage(message, level);
};

// Performance monitoring
export const startSpan = (name: string, op: string, fn: () => Promise<any>) => {
  return Sentry.startSpan({ name, op }, fn);
};
