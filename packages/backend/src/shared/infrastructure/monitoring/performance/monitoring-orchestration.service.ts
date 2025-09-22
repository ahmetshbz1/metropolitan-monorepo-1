// "monitoring-orchestration.service.ts"
// metropolitan backend  
// Monitoring orchestration and lifecycle management

import { redis } from "../../database/redis";

import { AlertManagementService } from "./alert-management.service";
import { MetricsCollectionService } from "./metrics-collection.service";
import { PerformanceAnalyticsService } from "./performance-analytics.service";
import { PERFORMANCE_CONFIG } from "./performance-types";

export class MonitoringOrchestrationService {
  private static monitoringInterval: Timer | null = null;
  
  /**
   * Start performance monitoring with automatic metric collection and alerting
   */
  static start(intervalMs: number = PERFORMANCE_CONFIG.DEFAULT_MONITORING_INTERVAL): void {
    if (this.monitoringInterval) {
      console.warn("Performance monitoring already started");
      return;
    }
    
    console.log("🚀 Starting performance monitoring...");
    
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, intervalMs);
  }
  
  /**
   * Stop performance monitoring
   */
  static stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("🛑 Performance monitoring stopped");
    }
  }

  /**
   * Check if monitoring is currently active
   */
  static isMonitoring(): boolean {
    return this.monitoringInterval !== null;
  }

  /**
   * Perform a single monitoring cycle
   */
  static async performMonitoringCycle(): Promise<void> {
    try {
      // Collect metrics
      const metrics = await MetricsCollectionService.collectAllMetrics();
      
      // Add to analytics for trending and reporting
      PerformanceAnalyticsService.addMetrics(metrics);
      
      // Check thresholds and generate alerts
      await AlertManagementService.checkThresholds(metrics);
      
      // Store metrics in Redis for distributed monitoring
      await this.storeMetricsInRedis(metrics);
    } catch (error) {
      console.error("Failed to collect performance metrics:", error);
    }
  }

  /**
   * Store metrics in Redis with proper TTL
   */
  private static async storeMetricsInRedis(metrics: any): Promise<void> {
    const key = `${PERFORMANCE_CONFIG.REDIS_KEYS.METRICS}:${Date.now()}`;
    await redis.setex(
      key,
      PERFORMANCE_CONFIG.REDIS_TTL.METRICS,
      JSON.stringify(metrics)
    );
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
   * Restart monitoring with new interval
   */
  static restart(intervalMs?: number): void {
    this.stop();
    this.start(intervalMs);
  }

  /**
   * Perform manual metric collection (one-time)
   */
  static async collectOnce(): Promise<any> {
    return this.performMonitoringCycle();
  }
}