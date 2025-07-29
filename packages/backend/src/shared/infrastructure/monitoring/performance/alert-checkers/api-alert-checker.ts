//  "api-alert-checker.ts"
//  metropolitan backend
//  API performance alert checking

import { BaseAlertChecker } from "./base-alert-checker";
import type { PerformanceMetrics, PerformanceAlert, APIThresholds } from "../performance-types";

export class APIAlertChecker extends BaseAlertChecker {
  constructor(private readonly thresholds: APIThresholds) {
    super();
  }
  
  check(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const { api } = metrics;
    
    if (api.responseTime > this.thresholds.responseTime) {
      alerts.push(
        this.createAlert(
          `High API response time: ${api.responseTime.toFixed(2)}ms (threshold: ${this.thresholds.responseTime}ms)`,
          metrics.timestamp,
          'api',
          api.responseTime > this.thresholds.responseTime * 2 ? 'error' : 'warning'
        )
      );
    }
    
    if (api.errorRate > this.thresholds.errorRate) {
      alerts.push(
        this.createAlert(
          `High API error rate: ${api.errorRate.toFixed(2)}% (threshold: ${this.thresholds.errorRate}%)`,
          metrics.timestamp,
          'api',
          api.errorRate > this.thresholds.errorRate * 2 ? 'error' : 'warning'
        )
      );
    }
    
    return alerts;
  }
}