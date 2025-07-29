//  "performance-monitor.ts"
//  metropolitan backend  
//  Main facade for performance monitoring system
//  Refactored: Delegates to specialized services for better maintainability

// Import focused modular services
import { MetricsCollectionService } from "./performance/metrics-collection.service";
import { AlertManagementService } from "./performance/alert-management.service";
import { PerformanceAnalyticsService } from "./performance/performance-analytics.service";
import { MonitoringOrchestrationService } from "./performance/monitoring-orchestration.service";
import { MonitoringHealthService } from "./performance/monitoring-health.service";

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
 * Performance Monitor Facade
 * Provides unified interface to all performance monitoring services
 * Maintains backward compatibility while delegating to specialized services
 */
export class PerformanceMonitor {
  
  // === MONITORING LIFECYCLE (delegated to MonitoringOrchestrationService) ===
  
  /**
   * Start performance monitoring
   */
  static start(intervalMs?: number) {
    return MonitoringOrchestrationService.start(intervalMs);
  }
  
  /**
   * Stop performance monitoring
   */
  static stop() {
    return MonitoringOrchestrationService.stop();
  }

  // === METRICS COLLECTION (delegated to MetricsCollectionService) ===

  static async collectMetrics() {
    return MetricsCollectionService.collectAllMetrics();
  }

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

  static setThresholds(thresholds: any) {
    return AlertManagementService.setThresholds(thresholds);
  }

  static getThresholds() {
    return AlertManagementService.getThresholds();
  }

  static async getRecentAlerts(limit?: number) {
    return AlertManagementService.getRecentAlerts(limit);
  }

  static async getAlertsByCategory(category: 'api' | 'database' | 'redis' | 'system', limit?: number) {
    return AlertManagementService.getAlertsByCategory(category, limit);
  }

  static async getAlertsBySeverity(severity: 'warning' | 'error', limit?: number) {
    return AlertManagementService.getAlertsBySeverity(severity, limit);
  }

  static async clearAlerts() {
    return AlertManagementService.clearAlerts();
  }

  // === ANALYTICS & REPORTING (delegated to PerformanceAnalyticsService) ===

  static async getReport(duration?: number) {
    return PerformanceAnalyticsService.getReport(duration);
  }

  static getPerformanceTrends(hours?: number) {
    return PerformanceAnalyticsService.getPerformanceTrends(hours);
  }

  static getCurrentStatus() {
    return PerformanceAnalyticsService.getCurrentStatus();
  }

  static getStatistics(startTime: number, endTime: number) {
    return PerformanceAnalyticsService.getStatistics(startTime, endTime);
  }

  static clearMetrics() {
    return PerformanceAnalyticsService.clearMetrics();
  }

  // === MONITORING ORCHESTRATION (delegated to MonitoringOrchestrationService) ===

  static isMonitoring(): boolean {
    return MonitoringOrchestrationService.isMonitoring();
  }

  static getConfig() {
    return MonitoringOrchestrationService.getConfig();
  }

  static restart(intervalMs?: number) {
    return MonitoringOrchestrationService.restart(intervalMs);
  }

  static async collectOnce() {
    return MonitoringOrchestrationService.collectOnce();
  }

  // === HEALTH CHECK (delegated to MonitoringHealthService) ===

  static async healthCheck() {
    return MonitoringHealthService.performHealthCheck(
      MonitoringOrchestrationService.isMonitoring()
    );
  }

  static async getDiagnostics() {
    return MonitoringHealthService.getDiagnostics();
  }
}

// Legacy compatibility - ensure old imports still work
export default PerformanceMonitor;