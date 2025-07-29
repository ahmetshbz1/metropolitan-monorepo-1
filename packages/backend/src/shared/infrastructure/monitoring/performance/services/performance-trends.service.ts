//  "performance-trends.service.ts"
//  metropolitan backend
//  Service for analyzing performance trends over time

import type { PerformanceMetrics } from "../performance-types";

export interface PerformanceTrends {
  api: { responseTime: number[]; throughput: number[]; errorRate: number[] };
  database: { queryTime: number[]; connectionPoolUsage: number[] };
  redis: { hitRate: number[]; memoryUsage: number[]; latency: number[] };
  timestamps: number[];
}

export class PerformanceTrendsService {
  /**
   * Extract performance trends from metrics
   */
  static getTrends(
    metrics: PerformanceMetrics[],
    startTime: number
  ): PerformanceTrends {
    const relevantMetrics = metrics.filter(m => m.timestamp >= startTime);
    
    return {
      api: {
        responseTime: relevantMetrics.map(m => m.api.responseTime),
        throughput: relevantMetrics.map(m => m.api.throughput),
        errorRate: relevantMetrics.map(m => m.api.errorRate),
      },
      database: {
        queryTime: relevantMetrics.map(m => m.database.queryTime),
        connectionPoolUsage: relevantMetrics.map(m => m.database.connectionPoolUsage),
      },
      redis: {
        hitRate: relevantMetrics.map(m => m.redis.hitRate),
        memoryUsage: relevantMetrics.map(m => m.redis.memoryUsage),
        latency: relevantMetrics.map(m => m.redis.latency),
      },
      timestamps: relevantMetrics.map(m => m.timestamp),
    };
  }
  
  /**
   * Get trends for last N hours
   */
  static getHourlyTrends(
    metrics: PerformanceMetrics[],
    hours: number = 24
  ): PerformanceTrends {
    const now = Date.now();
    const startTime = now - (hours * 60 * 60 * 1000);
    return this.getTrends(metrics, startTime);
  }
}