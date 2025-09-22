//  "alert-management.service.ts"
//  metropolitan backend  
//  Orchestrator for performance threshold monitoring and alerting

import { APIAlertChecker } from "./alert-checkers/api-alert-checker";
import type { AlertChecker } from "./alert-checkers/base-alert-checker";
import { DatabaseAlertChecker } from "./alert-checkers/database-alert-checker";
import { RedisAlertChecker } from "./alert-checkers/redis-alert-checker";
import { SystemAlertChecker } from "./alert-checkers/system-alert-checker";
import { AlertStorageService } from "./alert-storage.service";
import { DEFAULT_THRESHOLDS } from "./performance-types";
import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceThresholds 
} from "./performance-types";

export class AlertManagementService {
  private static thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private static checkers: Map<string, AlertChecker> = new Map();
  
  static {
    // Initialize checkers with default thresholds
    this.initializeCheckers();
  }
  
  /**
   * Set custom performance thresholds
   */
  static setThresholds(customThresholds: Partial<PerformanceThresholds>) {
    this.thresholds = {
      ...DEFAULT_THRESHOLDS,
      ...customThresholds,
      api: { ...DEFAULT_THRESHOLDS.api, ...customThresholds.api },
      database: { ...DEFAULT_THRESHOLDS.database, ...customThresholds.database },
      redis: { ...DEFAULT_THRESHOLDS.redis, ...customThresholds.redis },
      system: { ...DEFAULT_THRESHOLDS.system, ...customThresholds.system },
    };
    
    // Reinitialize checkers with new thresholds
    this.initializeCheckers();
  }

  /**
   * Get current thresholds
   */
  static getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Check performance thresholds and generate alerts
   */
  static async checkThresholds(metrics: PerformanceMetrics): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    
    // Run all checkers
    for (const checker of this.checkers.values()) {
      alerts.push(...checker.check(metrics));
    }
    
    // Store alerts if any found
    if (alerts.length > 0) {
      await AlertStorageService.storeAlerts(alerts);
    }
    
    return alerts;
  }

  /**
   * Get recent alerts from storage
   */
  static async getRecentAlerts(limit: number = 50): Promise<PerformanceAlert[]> {
    return AlertStorageService.getRecentAlerts(limit);
  }

  /**
   * Clear all stored alerts
   */
  static async clearAlerts(): Promise<void> {
    return AlertStorageService.clearAlerts();
  }

  /**
   * Get alerts by category
   */
  static async getAlertsByCategory(
    category: 'api' | 'database' | 'redis' | 'system',
    limit: number = 50
  ): Promise<PerformanceAlert[]> {
    return AlertStorageService.getAlertsByCategory(category, limit);
  }

  /**
   * Get alerts by severity
   */
  static async getAlertsBySeverity(
    severity: 'warning' | 'error',
    limit: number = 50
  ): Promise<PerformanceAlert[]> {
    return AlertStorageService.getAlertsBySeverity(severity, limit);
  }
  
  /**
   * Initialize alert checkers with current thresholds
   */
  private static initializeCheckers(): void {
    this.checkers.clear();
    this.checkers.set('api', new APIAlertChecker(this.thresholds.api));
    this.checkers.set('database', new DatabaseAlertChecker(this.thresholds.database));
    this.checkers.set('redis', new RedisAlertChecker(this.thresholds.redis));
    this.checkers.set('system', new SystemAlertChecker(this.thresholds.system));
  }
}