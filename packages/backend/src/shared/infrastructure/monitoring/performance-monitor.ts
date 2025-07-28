//  "performance-monitor.ts"
//  metropolitan backend  
//  Main orchestrator for performance monitoring system
//  Refactored: Now delegates to focused modular services for better maintainability

// Import focused modular services
import { MetricsCollectionService } from "./performance/metrics-collection.service";
import { AlertManagementService } from "./performance/alert-management.service";
import { PerformanceAnalyticsService } from "./performance/performance-analytics.service";
import { redis } from "../database/redis";
import { PERFORMANCE_CONFIG } from "./performance/performance-types";

// Re-export types and middleware for backward compatibility
export type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceReport,
  PerformanceThresholds
} from "./performance/performance-types";

export { 
  performanceMiddleware,
  detailedPerformanceMiddleware,
  PerformanceMiddlewareUtils
} from "./performance/performance-middleware";

/**
 * Main Performance Monitor - Now acts as orchestrator for modular services
 * Maintains backward compatibility while providing better code organization
 */
export class PerformanceMonitor {
  private static monitoringInterval: Timer | null = null;
  
  /**
   * Start performance monitoring with automatic metric collection and alerting
   */
  static start(intervalMs: number = PERFORMANCE_CONFIG.DEFAULT_MONITORING_INTERVAL) {
    if (this.monitoringInterval) {
      console.warn("Performance monitoring already started");
      return;
    }
    
    console.log("🚀 Starting performance monitoring...");
    
    this.monitoringInterval = setInterval(async () => {
      try {
        // Collect metrics using modular service
        const metrics = await MetricsCollectionService.collectAllMetrics();
        
        // Add to analytics for trending and reporting
        PerformanceAnalyticsService.addMetrics(metrics);
        
        // Check thresholds and generate alerts
        await AlertManagementService.checkThresholds(metrics);
        
        // Store metrics in Redis for distributed monitoring
        await redis.setex(
          `${PERFORMANCE_CONFIG.REDIS_KEYS.METRICS}:${Date.now()}`,
          PERFORMANCE_CONFIG.REDIS_TTL.METRICS,
          JSON.stringify(metrics)
        );
      } catch (error) {
        console.error("Failed to collect performance metrics:", error);
      }
    }, intervalMs);
  }
  
  /**
   * Stop performance monitoring
   */
  static stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("🛑 Performance monitoring stopped");
    }
  }

  // === METRICS COLLECTION (delegated to MetricsCollectionService) ===

  /**
   * Collect all current performance metrics
   */
  static async collectMetrics() {
    return MetricsCollectionService.collectAllMetrics();
  }

  /**
   * Get specific metric categories for targeted monitoring
   */
  static async getAPIMetrics() {
    return MetricsCollectionService.getAPIMetricsOnly();
  }

  static async getDatabaseMetrics() {
    return MetricsCollectionService.getDatabaseMetricsOnly();
  }

  static async getRedisMetrics() {
    return MetricsCollectionService.getRedisMetricsOnly();
  }

  static async getSystemMetrics() {
    return MetricsCollectionService.getSystemMetricsOnly();
  }

  // === ALERT MANAGEMENT (delegated to AlertManagementService) ===

  /**
   * Set custom performance thresholds
   */
  static setThresholds(thresholds: any) {
    return AlertManagementService.setThresholds(thresholds);
  }

  /**
   * Get current alert thresholds
   */
  static getThresholds() {
    return AlertManagementService.getThresholds();
  }

  /**
   * Get recent performance alerts
   */
  static async getRecentAlerts(limit?: number) {
    return AlertManagementService.getRecentAlerts(limit);
  }

  /**
   * Get alerts by category
   */
  static async getAlertsByCategory(category: 'api' | 'database' | 'redis' | 'system', limit?: number) {
    return AlertManagementService.getAlertsByCategory(category, limit);
  }

  /**
   * Clear all stored alerts
   */
  static async clearAlerts() {
    return AlertManagementService.clearAlerts();
  }

  // === ANALYTICS & REPORTING (delegated to PerformanceAnalyticsService) ===

  /**
   * Get comprehensive performance report
   */
  static async getReport(duration?: number) {
    return PerformanceAnalyticsService.getReport(duration);
  }

  /**
   * Get performance trends over time
   */
  static getPerformanceTrends(hours?: number) {
    return PerformanceAnalyticsService.getPerformanceTrends(hours);
  }

  /**
   * Get current system health status
   */
  static getCurrentStatus() {
    return PerformanceAnalyticsService.getCurrentStatus();
  }

  /**
   * Get detailed statistics for time range
   */
  static getStatistics(startTime: number, endTime: number) {
    return PerformanceAnalyticsService.getStatistics(startTime, endTime);
  }

  // === EXTENDED OPERATIONS (new capabilities from modular services) ===

  /**
   * Clear all stored metrics (for testing or reset)
   */
  static clearMetrics() {
    return PerformanceAnalyticsService.clearMetrics();
  }

  /**
   * Get alerts by severity level
   */
  static async getAlertsBySeverity(severity: 'warning' | 'error', limit?: number) {
    return AlertManagementService.getAlertsBySeverity(severity, limit);
  }

  /**
   * Check if monitoring is currently active
   */
  static isMonitoring(): boolean {
    return this.monitoringInterval !== null;
  }

  /**
   * Get monitoring configuration
   */
  static getConfig() {
    return {
      ...PERFORMANCE_CONFIG,
      isMonitoring: this.isMonitoring(),
    };
  }

  /**
   * Health check for the monitoring system itself
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    monitoring: boolean;
    services: {
      redis: boolean;
      database: boolean;
      metrics: boolean;
    };
    issues: string[];
  }> {
    const issues: string[] = [];
    const services = {
      redis: false,
      database: false,
      metrics: false,
    };

    // Check Redis connectivity
    try {
      await redis.ping();
      services.redis = true;
    } catch (error) {
      issues.push('Redis connection failed');
    }

    // Check if metrics collection is working
    try {
      await MetricsCollectionService.getAPIMetricsOnly();
      services.metrics = true;
    } catch (error) {
      issues.push('Metrics collection failed');
    }

    // Check database connectivity (through metrics collection)
    try {
      await MetricsCollectionService.getDatabaseMetricsOnly();
      services.database = true;
    } catch (error) {
      issues.push('Database metrics collection failed');
    }

    const status = issues.length === 0 ? 'healthy' : 
                  issues.length <= 1 ? 'warning' : 'error';

    return {
      status,
      monitoring: this.isMonitoring(),
      services,
      issues,
    };
  }
}

// Legacy compatibility - ensure old imports still work
export default PerformanceMonitor;