//  "performance-statistics.service.ts"
//  metropolitan backend
//  Service for calculating performance statistics

import type { PerformanceMetrics } from "../performance-types";
import { MetricsCalculator } from "../utils/metrics-calculator";

export interface MetricStatistics {
  min: number;
  max: number;
  avg: number;
  p95: number;
}

export interface PerformanceStatistics {
  metrics: {
    api: MetricStatistics[];
    database: MetricStatistics[];
    redis: MetricStatistics[];
  };
  sampleCount: number;
}

export class PerformanceStatisticsService {
  /**
   * Calculate performance statistics for a time range
   */
  static getStatistics(
    metrics: PerformanceMetrics[],
    startTime: number,
    endTime: number
  ): PerformanceStatistics | null {
    const relevantMetrics = metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );

    if (relevantMetrics.length === 0) {
      return null;
    }

    const apiResponseTimes = relevantMetrics.map(m => m.api.responseTime);
    const dbQueryTimes = relevantMetrics.map(m => m.database.queryTime);
    const redisLatencies = relevantMetrics.map(m => m.redis.latency);

    return {
      metrics: {
        api: [this.calculateStats(apiResponseTimes)],
        database: [this.calculateStats(dbQueryTimes)],
        redis: [this.calculateStats(redisLatencies)],
      },
      sampleCount: relevantMetrics.length,
    };
  }
  
  private static calculateStats(values: number[]): MetricStatistics {
    return {
      min: MetricsCalculator.min(values),
      max: MetricsCalculator.max(values),
      avg: MetricsCalculator.average(values),
      p95: MetricsCalculator.percentile(values, 95),
    };
  }
}