//  "performance-report.service.ts"
//  metropolitan backend
//  Service for building comprehensive performance reports

import type { 
  PerformanceMetrics, 
  PerformanceReport,
  PerformanceAlert 
} from "../performance-types";
import { MetricsCalculator } from "../utils/metrics-calculator";
import { AlertStorageService } from "../alert-storage.service";

export class PerformanceReportService {
  /**
   * Build comprehensive performance report
   */
  static async buildReport(
    metrics: PerformanceMetrics[],
    duration: number = 3600000
  ): Promise<PerformanceReport | { error: string }> {
    const now = Date.now();
    const startTime = now - duration;
    
    // Filter metrics within duration
    const relevantMetrics = metrics.filter(m => m.timestamp >= startTime);
    
    if (relevantMetrics.length === 0) {
      return { error: "No metrics available for the specified duration" };
    }
    
    // Calculate aggregated averages
    const avgMetrics = this.calculateAverages(relevantMetrics);
    
    // Get recent alerts
    const alerts = await AlertStorageService.getRecentAlerts(50);
    
    return {
      duration,
      sampleCount: relevantMetrics.length,
      averages: avgMetrics,
      current: relevantMetrics[relevantMetrics.length - 1],
      alerts,
    };
  }
  
  private static calculateAverages(metrics: PerformanceMetrics[]) {
    return {
      api: {
        responseTime: MetricsCalculator.average(metrics.map(m => m.api.responseTime)),
        throughput: MetricsCalculator.average(metrics.map(m => m.api.throughput)),
        errorRate: MetricsCalculator.average(metrics.map(m => m.api.errorRate)),
      },
      database: {
        queryTime: MetricsCalculator.average(metrics.map(m => m.database.queryTime)),
        connectionPoolUsage: MetricsCalculator.average(metrics.map(m => m.database.connectionPoolUsage)),
        slowQueries: MetricsCalculator.sum(metrics.map(m => m.database.slowQueries)),
      },
      redis: {
        hitRate: MetricsCalculator.average(metrics.map(m => m.redis.hitRate)),
        memoryUsage: MetricsCalculator.average(metrics.map(m => m.redis.memoryUsage)),
        latency: MetricsCalculator.average(metrics.map(m => m.redis.latency)),
      },
    };
  }
}