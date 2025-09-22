//  "system-alert-checker.ts"
//  metropolitan backend
//  System performance alert checking

import type { PerformanceMetrics, PerformanceAlert, SystemThresholds } from "../performance-types";

import { BaseAlertChecker } from "./base-alert-checker";

export class SystemAlertChecker extends BaseAlertChecker {
  constructor(private readonly thresholds: SystemThresholds) {
    super();
  }
  
  check(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const { system } = metrics;
    
    if (system.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push(
        this.createAlert(
          `High memory usage: ${system.memoryUsage.toFixed(2)}% (threshold: ${this.thresholds.memoryUsage}%)`,
          metrics.timestamp,
          'system',
          'error'
        )
      );
    }
    
    return alerts;
  }
}