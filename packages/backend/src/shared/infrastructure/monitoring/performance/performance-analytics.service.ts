//  "performance-analytics.service.ts"
//  metropolitan backend  
//  Orchestrator for performance analytics and reporting

import type { PerformanceMetrics, PerformanceReport } from "./performance-types";
import { PERFORMANCE_CONFIG } from "./performance-types";
import { PerformanceReportService } from "./services/performance-report.service";
import { PerformanceStatisticsService } from "./services/performance-statistics.service";
import type { PerformanceStatistics } from "./services/performance-statistics.service";
import { PerformanceStatusService } from "./services/performance-status.service";
import type { PerformanceStatus } from "./services/performance-status.service";
import { PerformanceTrendsService } from "./services/performance-trends.service";
import type { PerformanceTrends } from "./services/performance-trends.service";

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
    return PerformanceReportService.buildReport(this.metrics, duration);
  }

  /**
   * Get performance trends over time
   */
  static getPerformanceTrends(hours: number = 24): PerformanceTrends {
    return PerformanceTrendsService.getHourlyTrends(this.metrics, hours);
  }

  /**
   * Get current performance status
   */
  static getCurrentStatus(): PerformanceStatus {
    return PerformanceStatusService.getCurrentStatus(this.metrics);
  }

  /**
   * Get performance statistics for a specific time range
   */
  static getStatistics(
    startTime: number,
    endTime: number
  ): PerformanceStatistics | null {
    return PerformanceStatisticsService.getStatistics(this.metrics, startTime, endTime);
  }

  /**
   * Clear all stored metrics (for testing or reset)
   */
  static clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Get current metrics for external use
   */
  static getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}