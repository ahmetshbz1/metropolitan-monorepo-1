//  "logger.config.ts"
//  metropolitan backend
//  Created by Ahmet on 01.06.2025.

import { randomUUID } from "crypto";
import pino from "pino";

// Log levels
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

// Custom log context
export interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  domain?: string;
  duration?: number;
  [key: string]: any;
}

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || "unknown",
    service: "metropolitan-backend",
    version: process.env.npm_package_version || "1.0.0",
  },
});

// Logger wrapper with context
export class Logger {
  private requestId?: string;
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.requestId = context.requestId || randomUUID();
  }

  private formatMessage(level: LogLevel, message: string, meta?: any) {
    const logData = {
      ...this.context,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    return { message, ...logData };
  }

  trace(message: string, meta?: any) {
    logger.trace(this.formatMessage("trace", message, meta));
  }

  debug(message: string, meta?: any) {
    logger.debug(this.formatMessage("debug", message, meta));
  }

  info(message: string, meta?: any) {
    logger.info(this.formatMessage("info", message, meta));
  }

  warn(message: string, meta?: any) {
    logger.warn(this.formatMessage("warn", message, meta));
  }

  error(message: string, error?: Error, meta?: any) {
    const logData = this.formatMessage("error", message, {
      ...meta,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
    logger.error(logData);
  }

  fatal(message: string, error?: Error, meta?: any) {
    const logData = this.formatMessage("fatal", message, {
      ...meta,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
    logger.fatal(logData);
  }

  // Performance logging
  performanceLog(operation: string, duration: number, meta?: any) {
    this.info(`${operation}completed`, {
      ...meta,
      operation,
      duration: `${duration}ms`,
      performance: true,
    });
  }

  // Domain-specific logging
  domainLog(domain: string, operation: string, message: string, meta?: any) {
    this.info(message, {
      ...meta,
      domain,
      operation,
    });
  }

  // Business metrics
  businessMetric(metric: string, value: number | string, meta?: any) {
    this.info(`Business metric: ${metric}`, {
      ...meta,
      metric,
      value,
      business_metric: true,
    });
  }

  // Security logging
  securityLog(
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    meta?: any
  ) {
    this.warn(`Security event: ${event}`, {
      ...meta,
      security_event: event,
      severity,
      security: true,
    });
  }
}

// Global logger instance
export const globalLogger = new Logger({
  operation: "global",
});

// Create request-scoped logger
export const createRequestLogger = (
  requestId: string,
  context?: LogContext
) => {
  return new Logger({
    ...context,
    requestId,
  });
};
