//  "performance-status.service.ts"
//  metropolitan backend
//  Service for evaluating current performance status

import type { PerformanceMetrics } from "../performance-types";

export interface PerformanceStatus {
  status: 'healthy' | 'warning' | 'error';
  current?: PerformanceMetrics;
  issues: string[];
}

export class PerformanceStatusService {
  /**
   * Evaluate current performance status
   */
  static getCurrentStatus(metrics: PerformanceMetrics[]): PerformanceStatus {
    if (metrics.length === 0) {
      return {
        status: 'error',
        issues: ['No performance data available'],
      };
    }

    const current = metrics[metrics.length - 1];
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
}