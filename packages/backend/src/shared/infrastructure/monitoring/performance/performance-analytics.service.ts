//  "performance-analytics.service.ts"
//  metropolitan backend  
//  Focused service for performance reporting and analytics
//  Extracted from performance-monitor.ts (lines 291-340)

import { redis } from "../../database/redis";
import type { 
  PerformanceMetrics, 
  PerformanceReport, 
  PerformanceAlert 
} from "./performance-types";
import { PERFORMANCE_CONFIG } from "./performance-types";

export class PerformanceAnalyticsService {
  private static metrics: PerformanceMetrics[] = [];

  /**
   * Add metrics to in-memory storage for analytics
   */
  static addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > PERFORMANCE_CONFIG.MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-PERFORMANCE_CONFIG.MAX_METRICS_HISTORY);
    }
  }

  /**
   * Get comprehensive performance report
   */
  static async getReport(duration: number = 3600000): Promise<PerformanceReport | { error: string }> {
    const now = Date.now();
    const startTime = now - duration;
    
    // Filter metrics within duration from in-memory storage
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= startTime);
    
    if (relevantMetrics.length === 0) {
      return { error: "No metrics available for the specified duration" };
    }
    
    // Calculate aggregated averages
    const avgMetrics = {
      api: {
        responseTime: this.average(relevantMetrics.map(m => m.api.responseTime)),
        throughput: this.average(relevantMetrics.map(m => m.api.throughput)),
        errorRate: this.average(relevantMetrics.map(m => m.api.errorRate)),
      },
      database: {
        queryTime: this.average(relevantMetrics.map(m => m.database.queryTime)),
        connectionPoolUsage: this.average(relevantMetrics.map(m => m.database.connectionPoolUsage)),
        slowQueries: this.sum(relevantMetrics.map(m => m.database.slowQueries)),
      },
      redis: {
        hitRate: this.average(relevantMetrics.map(m => m.redis.hitRate)),
        memoryUsage: this.average(relevantMetrics.map(m => m.redis.memoryUsage)),
        latency: this.average(relevantMetrics.map(m => m.redis.latency)),
      },
    };
    
    // Get recent alerts
    const alerts = await this.getRecentAlerts(50);
    
    return {
      duration,
      sampleCount: relevantMetrics.length,
      averages: avgMetrics,
      current: relevantMetrics[relevantMetrics.length - 1],
      alerts,
    };
  }

  /**
   * Get performance trends over time
   */
  static getPerformanceTrends(hours: number = 24): {
    api: { responseTime: number[]; throughput: number[]; errorRate: number[] };
    database: { queryTime: number[]; connectionPoolUsage: number[] };
    redis: { hitRate: number[]; memoryUsage: number[]; latency: number[] };
    timestamps: number[];
  } {
    const now = Date.now();
    const startTime = now - (hours * 60 * 60 * 1000);
    
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= startTime);
    
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
   * Get current performance status
   */
  static getCurrentStatus(): {
    status: 'healthy' | 'warning' | 'error';
    current?: PerformanceMetrics;
    issues: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        status: 'error',
        issues: ['No performance data available'],
      };
    }

    const current = this.metrics[this.metrics.length - 1];
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';

    // Check API health
    if (current.api.responseTime > 1000) {
      issues.push('Very high API response time');
      status = 'error';
    } else if (current.api.responseTime > 500) {
      issues.push('High API response time');
      status = status === 'healthy' ? 'warning' : status;
    }

    if (current.api.errorRate > 10) {
      issues.push('Very high API error rate');
      status = 'error';
    } else if (current.api.errorRate > 5) {
      issues.push('High API error rate');
      status = status === 'healthy' ? 'warning' : status;
    }

    // Check Database health  
    if (current.database.queryTime > 200) {
      issues.push('Very slow database queries');
      status = 'error';
    } else if (current.database.queryTime > 100) {
      issues.push('Slow database queries');
      status = status === 'healthy' ? 'warning' : status;
    }

    // Check Redis health
    if (current.redis.hitRate < 50) {
      issues.push('Very low Redis hit rate');
      status = 'error';
    } else if (current.redis.hitRate < 80) {
      issues.push('Low Redis hit rate');
      status = status === 'healthy' ? 'warning' : status;
    }

    return {
      status,
      current,
      issues,
    };
  }

  /**
   * Get performance statistics for a specific time range
   */
  static getStatistics(
    startTime: number,
    endTime: number
  ): {
    metrics: {
      api: { min: number; max: number; avg: number; p95: number }[];
      database: { min: number; max: number; avg: number; p95: number }[];
      redis: { min: number; max: number; avg: number; p95: number }[];
    };
    sampleCount: number;
  } | null {
    const relevantMetrics = this.metrics.filter(
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
        api: [{
          min: Math.min(...apiResponseTimes),
          max: Math.max(...apiResponseTimes),
          avg: this.average(apiResponseTimes),
          p95: this.percentile(apiResponseTimes, 95),
        }],
        database: [{
          min: Math.min(...dbQueryTimes),
          max: Math.max(...dbQueryTimes),
          avg: this.average(dbQueryTimes),
          p95: this.percentile(dbQueryTimes, 95),
        }],
        redis: [{
          min: Math.min(...redisLatencies),
          max: Math.max(...redisLatencies),
          avg: this.average(redisLatencies),
          p95: this.percentile(redisLatencies, 95),
        }],
      },
      sampleCount: relevantMetrics.length,
    };
  }

  /**
   * Clear all stored metrics (for testing or reset)
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get recent alerts for reports
   */
  private static async getRecentAlerts(limit: number): Promise<PerformanceAlert[]> {
    const alerts = await redis.lrange(PERFORMANCE_CONFIG.REDIS_KEYS.ALERTS, 0, limit - 1);
    
    return alerts.map(alertString => {
      try {
        return JSON.parse(alertString) as PerformanceAlert;
      } catch (error) {
        console.warn('Failed to parse alert in analytics:', alertString);
        return null;
      }
    }).filter(Boolean) as PerformanceAlert[];
  }

  // === UTILITY FUNCTIONS ===

  private static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private static sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }

  private static percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}