//  "base-alert-checker.ts"
//  metropolitan backend
//  Base interface for all alert checkers

import type { PerformanceMetrics, PerformanceAlert } from "../performance-types";

export interface AlertChecker {
  check(metrics: PerformanceMetrics): PerformanceAlert[];
}

export abstract class BaseAlertChecker implements AlertChecker {
  protected createAlert(
    message: string,
    timestamp: string,
    category: 'api' | 'database' | 'redis' | 'system',
    severity: 'warning' | 'error' = 'warning'
  ): PerformanceAlert {
    return {
      alert: message,
      timestamp,
      severity,
      category,
    };
  }
  
  abstract check(metrics: PerformanceMetrics): PerformanceAlert[];
}