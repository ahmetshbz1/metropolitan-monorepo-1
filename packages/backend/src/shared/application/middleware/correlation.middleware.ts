//  "correlation.middleware.ts"
//  metropolitan backend
//  Created by Ahmet on 24.06.2025.

import { randomUUID } from "crypto";
import { Elysia } from "elysia";
import { createRequestLogger } from "../../infrastructure/monitoring/logger.config";

export interface RequestContext {
  requestId: string;
  startTime: number;
  logger: ReturnType<typeof createRequestLogger>;
  user?: {
    id: string;
    email: string;
  };
}

// Request correlation plugin for Elysia
export const correlationPlugin = new Elysia({ name: "correlation" })
  // Derive request context
  .derive(({ request, set }) => {
    const requestId = request.headers.get("x-request-id") || randomUUID();
    const startTime = Date.now();

    // Request logger oluştur
    const logger = createRequestLogger(requestId, {
      operation: "http_request",
      method: request.method,
      url: request.url,
    });

    // Response header'a correlation ID ekle
    set.headers["x-request-id"] = requestId;

    // Context oluştur
    const requestContext: RequestContext = {
      requestId,
      startTime,
      logger,
    };

    // İsteği logla
    logger.info("Request started", {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    return {
      requestContext,
    };
  })

  // After response - performance logging
  .onAfterResponse(({ requestContext, set }) => {
    if (requestContext) {
      const duration = Date.now() - requestContext.startTime;

      requestContext.logger.performanceLog("HTTP Request", duration, {
        statusCode: set.status || 200,
      });
    }
  })

  // Error handling
  .onError(({ error, requestContext, set }) => {
    if (requestContext) {
      const duration = Date.now() - requestContext.startTime;

      // Error'u Error tipine dönüştür
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      requestContext.logger.error("Request failed", errorObj, {
        duration: `${duration}ms`,
        statusCode: set.status || 500,
      });
    }
  });
