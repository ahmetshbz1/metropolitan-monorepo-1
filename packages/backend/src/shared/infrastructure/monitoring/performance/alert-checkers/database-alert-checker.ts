//  "database-alert-checker.ts"
//  metropolitan backend
//  Database performance alert checking

import type { PerformanceMetrics, PerformanceAlert, DatabaseThresholds } from "../performance-types";

import { BaseAlertChecker } from "./base-alert-checker";

export class DatabaseAlertChecker extends BaseAlertChecker {
  constructor(private readonly thresholds: DatabaseThresholds) {
    super();
  }
  
  check(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const { database } = metrics;
    
    if (database.queryTime > this.thresholds.queryTime) {
      alerts.push(
        this.createAlert(
          `Slow database queries: ${database.queryTime.toFixed(2)}ms avg (threshold: ${this.thresholds.queryTime}ms)`,
          metrics.timestamp,
          'database',
          database.queryTime > this.thresholds.queryTime * 2 ? 'error' : 'warning'
        )
      );
    }
    
    if (database.connectionPoolUsage > this.thresholds.connectionPoolUsage) {
      alerts.push(
        this.createAlert(
          `High connection pool usage: ${database.connectionPoolUsage.toFixed(2)}% (threshold: ${this.thresholds.connectionPoolUsage}%)`,
          metrics.timestamp,
          'database',
          'error'
        )
      );
    }
    
    if (database.deadlocks > this.thresholds.deadlocks) {
      alerts.push(
        this.createAlert(
          `Database deadlocks detected: ${database.deadlocks} (threshold: ${this.thresholds.deadlocks})`,
          metrics.timestamp,
          'database',
          'error'
        )
      );
    }
    
    return alerts;
  }
}