//  "redis-alert-checker.ts"
//  metropolitan backend
//  Redis performance alert checking

import type { PerformanceMetrics, PerformanceAlert, RedisThresholds } from "../performance-types";

import { BaseAlertChecker } from "./base-alert-checker";

export class RedisAlertChecker extends BaseAlertChecker {
  constructor(private readonly thresholds: RedisThresholds) {
    super();
  }
  
  check(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const { redis } = metrics;
    
    if (redis.hitRate < this.thresholds.hitRate) {
      alerts.push(
        this.createAlert(
          `Low Redis hit rate: ${redis.hitRate.toFixed(2)}% (threshold: ${this.thresholds.hitRate}%)`,
          metrics.timestamp,
          'redis',
          redis.hitRate < this.thresholds.hitRate * 0.5 ? 'error' : 'warning'
        )
      );
    }
    
    if (redis.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push(
        this.createAlert(
          `High Redis memory usage: ${redis.memoryUsage.toFixed(2)}% (threshold: ${this.thresholds.memoryUsage}%)`,
          metrics.timestamp,
          'redis',
          'error'
        )
      );
    }
    
    if (redis.latency > this.thresholds.latency) {
      alerts.push(
        this.createAlert(
          `High Redis latency: ${redis.latency}ms (threshold: ${this.thresholds.latency}ms)`,
          metrics.timestamp,
          'redis',
          redis.latency > this.thresholds.latency * 2 ? 'error' : 'warning'
        )
      );
    }
    
    return alerts;
  }
}