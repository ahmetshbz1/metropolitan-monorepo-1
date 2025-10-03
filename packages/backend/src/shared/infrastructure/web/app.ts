/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
//  "app.ts"
//  metropolitan backend
//  Created by Ahmet on 21.06.2025.

import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

import { healthRoutes } from "../../application/common/health.routes";
import { correlationPlugin } from "../../application/middleware/correlation.middleware";
import { envConfig } from "../config/env.config";
import { db } from "../database/connection";
import { globalLogger } from "../monitoring/logger.config";
import { captureError, initializeSentry } from "../monitoring/sentry.config";

// Initialize Sentry before everything else
initializeSentry();

export const createApp = () =>
  new Elysia()
    // Add request correlation and logging
    .use(correlationPlugin)

    // Database connection
    .decorate("db", db)

    // JWT setup with validated secret
    .use(
      jwt({
        name: "jwt",
        secret: envConfig.JWT_SECRET,
      })
    )

    // Health check routes
    .use(healthRoutes)

    // Global error handler with Sentry integration
    .onError(({ error, code, set, requestContext }) => {
      const errorId = Math.random().toString(36).substr(2, 9);

      // Parse structured errors from CartValidationService
      let structuredError = null;
      try {
        structuredError = JSON.parse(error.message);
        console.log("🟡 [Backend Error Handler] Parsed error:", {
          structuredError,
          hasKey: !!structuredError?.key,
          rawMessage: error.message,
        });
      } catch (e) {
        console.log("🟡 [Backend Error Handler] Not a JSON error:", error.message);
        // Not a structured error, continue normally
      }

      // Log error with context
      if (requestContext?.logger) {
        requestContext.logger.error("Unhandled error", error, {
          errorId,
          code,
          structuredError,
        });
      } else {
        globalLogger.error("Unhandled error (no context)", error, {
          errorId,
          code,
          structuredError,
        });
      }

      // Send to Sentry
      captureError(error, {
        errorId,
        code,
        structuredError,
        requestId: requestContext?.requestId,
      });

      // Handle structured errors (from cart validation, etc.)
      if (structuredError?.key) {
        console.log("🔴 [Backend Error Handler] Structured error detected:", {
          key: structuredError.key,
          params: structuredError.params,
          message: structuredError.message,
          status: 400,
        });
        set.status = 400;
        return {
          key: structuredError.key,
          params: structuredError.params,
          message: structuredError.message, // Use parsed message, not raw JSON string
          errorId,
        };
      }

      // Set appropriate status code
      switch (code) {
        case "NOT_FOUND":
          set.status = 404;
          return {
            error: "Not Found",
            message: "The requested resource was not found",
            errorId,
          };
        case "VALIDATION":
          set.status = 400;
          return {
            error: "Validation Error",
            message: error.message,
            errorId,
          };
        case "UNAUTHORIZED":
          set.status = 401;
          return {
            error: "Unauthorized",
            message: "Authentication required",
            errorId,
          };
        case "FORBIDDEN":
          set.status = 403;
          return {
            error: "Forbidden",
            message: "Insufficient permissions",
            errorId,
          };
        default:
          set.status = 500;
          return {
            error: "Internal Server Error",
            message:
              envConfig.NODE_ENV === "development"
                ? error.message
                : "An unexpected error occurred",
            errorId,
          };
      }
    })

    // Startup logging
    .onStart(async () => {
      globalLogger.info("🚀 Metropolitan Backend starting...", {
        environment: envConfig.NODE_ENV,
        version: process.env.npm_package_version || "1.0.0",
      });

      const { OverduePaymentService } = await import("../../../domains/payment/application/services/overdue-payment.service");

      const checkInterval = 24 * 60 * 60 * 1000;

      const runCheck = async () => {
        try {
          const result = await OverduePaymentService.checkAndNotifyOverduePayments();
          globalLogger.info("Vadesi geçmiş ödeme kontrolü tamamlandı", {
            checked: result.checked,
            notified: result.notified,
            errors: result.errors,
          });
        } catch (error) {
          globalLogger.error("Vadesi geçmiş ödeme kontrolü hatası", error);
        }
      };

      await runCheck();

      setInterval(runCheck, checkInterval);

      globalLogger.info("Vadesi geçmiş ödeme kontrolü başlatıldı (her 24 saatte bir)");
    })

    // Shutdown logging
    .onStop(() => {
      globalLogger.info("🛑 Metropolitan Backend shutting down...");
    });
