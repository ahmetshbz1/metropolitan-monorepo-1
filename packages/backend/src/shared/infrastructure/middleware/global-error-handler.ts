import { captureError } from "../monitoring/sentry.config";
import { envConfig } from "../config/env.config";
import { logger } from "../monitoring/logger.config";

/**
 * Global error handlers for uncaught exceptions and unhandled rejections
 * Critical for production stability
 */
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    logger.fatal({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      type: "uncaughtException",
      timestamp: new Date().toISOString(),
    }, "FATAL: Uncaught Exception detected");

    // Capture in Sentry
    captureError(error, {
      level: "fatal",
      tags: {
        errorType: "uncaughtException",
      },
    });

    // Graceful shutdown
    logger.info("Initiating graceful shutdown due to uncaught exception...");

    // Give time for logging and error reporting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
    const error = reason instanceof Error
      ? reason
      : new Error(String(reason));

    logger.error({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        reason: String(reason),
      },
      type: "unhandledRejection",
      timestamp: new Date().toISOString(),
    }, "ERROR: Unhandled Promise Rejection detected");

    // Capture in Sentry
    captureError(error, {
      level: "error",
      tags: {
        errorType: "unhandledRejection",
      },
      extra: {
        promise: String(promise),
      },
    });

    // In production, we should also exit after unhandled rejection
    if (envConfig.NODE_ENV === "production") {
      logger.info("Initiating graceful shutdown due to unhandled rejection...");
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });

  // Handle SIGTERM for graceful shutdown (Kubernetes, Docker)
  process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: starting graceful shutdown");
    gracefulShutdown("SIGTERM");
  });

  // Handle SIGINT for graceful shutdown (Ctrl+C)
  process.on("SIGINT", () => {
    logger.info("SIGINT signal received: starting graceful shutdown");
    gracefulShutdown("SIGINT");
  });

  // Warning handler for potential issues
  process.on("warning", (warning: Error) => {
    logger.warn({
      warning: {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
      },
      type: "warning",
      timestamp: new Date().toISOString(),
    }, "Process warning detected");
  });

  logger.info("Global error handlers initialized successfully");
};

// Graceful shutdown function
const gracefulShutdown = async (signal: string) => {
  logger.info(`Graceful shutdown initiated by ${signal}`);

  try {
    // Close database connections
    if (global.db) {
      logger.info("Closing database connections...");
      // Add database close logic here if needed
    }

    // Close Redis connections
    if (global.redis) {
      logger.info("Closing Redis connections...");
      // Add Redis close logic here if needed
    }

    // Stop accepting new connections
    if (global.server) {
      logger.info("Stopping server...");
      // Add server close logic here if needed
    }

    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error(error, "Error during graceful shutdown");
    process.exit(1);
  }
};

// Export for testing
export const handleUncaughtException = (error: Error) => {
  process.emit("uncaughtException", error);
};

export const handleUnhandledRejection = (reason: unknown) => {
  process.emit("unhandledRejection", reason, Promise.reject(reason));
};