//  "alert-management.service.ts"
//  metropolitan backend  
//  Focused service for performance threshold monitoring and alerting
//  Extracted from performance-monitor.ts (lines 236-286)

import { redis } from "../../database/redis";
import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceThresholds 
} from "./performance-types";
import { DEFAULT_THRESHOLDS, PERFORMANCE_CONFIG } from "./performance-types";

export class AlertManagementService {
  private static thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;

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
    
    // Check API thresholds
    alerts.push(...this.checkAPIThresholds(metrics));
    
    // Check Database thresholds
    alerts.push(...this.checkDatabaseThresholds(metrics));
    
    // Check Redis thresholds  
    alerts.push(...this.checkRedisThresholds(metrics));
    
    // Check System thresholds
    alerts.push(...this.checkSystemThresholds(metrics));
    
    // Store alerts if any found
    if (alerts.length > 0) {
      await this.storeAlerts(alerts);
    }
    
    return alerts;
  }

  /**
   * Check API performance thresholds
   */
  private static checkAPIThresholds(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const { api } = metrics;
    const thresholds = this.thresholds.api;
    
    if (api.responseTime > thresholds.responseTime) {
      alerts.push({
        alert: `High API response time: ${api.responseTime.toFixed(2)}ms (threshold: ${thresholds.responseTime}ms)`,
        timestamp: metrics.timestamp,
        severity: api.responseTime > thresholds.responseTime * 2 ? 'error' : 'warning',
        category: 'api',
      });
    }
    
    if (api.errorRate > thresholds.errorRate) {
      alerts.push({
        alert: `High API error rate: ${api.errorRate.toFixed(2)}% (threshold: ${thresholds.errorRate}%)`,
        timestamp: metrics.timestamp,
        severity: api.errorRate > thresholds.errorRate * 2 ? 'error' : 'warning',
        category: 'api',
      });
    }
    
    return alerts;
  }

  /**
   * Check Database performance thresholds
   */
  private static checkDatabaseThresholds(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const { database } = metrics;
    const thresholds = this.thresholds.database;
    
    if (database.queryTime > thresholds.queryTime) {
      alerts.push({
        alert: `Slow database queries: ${database.queryTime.toFixed(2)}ms avg (threshold: ${thresholds.queryTime}ms)`,
        timestamp: metrics.timestamp,
        severity: database.queryTime > thresholds.queryTime * 2 ? 'error' : 'warning',
        category: 'database',
      });
    }
    
    if (database.connectionPoolUsage > thresholds.connectionPoolUsage) {
      alerts.push({
        alert: `High connection pool usage: ${database.connectionPoolUsage.toFixed(2)}% (threshold: ${thresholds.connectionPoolUsage}%)`,
        timestamp: metrics.timestamp,
        severity: 'error',
        category: 'database',
      });
    }
    
    if (database.deadlocks > thresholds.deadlocks) {
      alerts.push({
        alert: `Database deadlocks detected: ${database.deadlocks} (threshold: ${thresholds.deadlocks})`,
        timestamp: metrics.timestamp,
        severity: 'error', 
        category: 'database',
      });
    }
    
    return alerts;
  }

  /**
   * Check Redis performance thresholds
   */
  private static checkRedisThresholds(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const { redis } = metrics;
    const thresholds = this.thresholds.redis;
    
    if (redis.hitRate < thresholds.hitRate) {
      alerts.push({
        alert: `Low Redis hit rate: ${redis.hitRate.toFixed(2)}% (threshold: ${thresholds.hitRate}%)`,
        timestamp: metrics.timestamp,
        severity: redis.hitRate < thresholds.hitRate * 0.5 ? 'error' : 'warning',
        category: 'redis',
      });
    }
    
    if (redis.memoryUsage > thresholds.memoryUsage) {
      alerts.push({
        alert: `High Redis memory usage: ${redis.memoryUsage.toFixed(2)}% (threshold: ${thresholds.memoryUsage}%)`,
        timestamp: metrics.timestamp,
        severity: 'error',
        category: 'redis',
      });
    }
    
    if (redis.latency > thresholds.latency) {
      alerts.push({
        alert: `High Redis latency: ${redis.latency}ms (threshold: ${thresholds.latency}ms)`,
        timestamp: metrics.timestamp,
        severity: redis.latency > thresholds.latency * 2 ? 'error' : 'warning',
        category: 'redis',
      });
    }
    
    return alerts;
  }

  /**
   * Check System performance thresholds
   */
  private static checkSystemThresholds(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const { system } = metrics;
    const thresholds = this.thresholds.system;
    
    if (system.memoryUsage > thresholds.memoryUsage) {
      alerts.push({
        alert: `High memory usage: ${system.memoryUsage.toFixed(2)}% (threshold: ${thresholds.memoryUsage}%)`,
        timestamp: metrics.timestamp,
        severity: 'error',
        category: 'system',
      });
    }
    
    return alerts;
  }

  /**
   * Store alerts in Redis for dashboard access
   */
  private static async storeAlerts(alerts: PerformanceAlert[]): Promise<void> {
    if (alerts.length === 0) return;
    
    // Log alerts to console with emoji indicators
    const formattedAlerts = alerts.map(alert => {
      const icon = alert.severity === 'error' ? '🚨' : '⚠️';
      return `${icon} ${alert.alert}`;
    });
    
    console.error("Performance alerts:", formattedAlerts);
    
    // Store alerts in Redis for dashboard
    const serializedAlerts = alerts.map(alert => JSON.stringify(alert));
    await redis.lpush(PERFORMANCE_CONFIG.REDIS_KEYS.ALERTS, ...serializedAlerts);
    
    // Keep only recent alerts (last 1000)
    await redis.ltrim(PERFORMANCE_CONFIG.REDIS_KEYS.ALERTS, 0, 999);
  }

  /**
   * Get recent alerts from Redis
   */
  static async getRecentAlerts(limit: number = 50): Promise<PerformanceAlert[]> {
    const alerts = await redis.lrange(PERFORMANCE_CONFIG.REDIS_KEYS.ALERTS, 0, limit - 1);
    
    return alerts.map(alertString => {
      try {
        return JSON.parse(alertString) as PerformanceAlert;
      } catch (error) {
        console.warn('Failed to parse alert:', alertString);
        return null;
      }
    }).filter(Boolean) as PerformanceAlert[];
  }

  /**
   * Clear all stored alerts
   */
  static async clearAlerts(): Promise<void> {
    await redis.del(PERFORMANCE_CONFIG.REDIS_KEYS.ALERTS);
  }

  /**
   * Get alerts by category
   */
  static async getAlertsByCategory(
    category: 'api' | 'database' | 'redis' | 'system',
    limit: number = 50
  ): Promise<PerformanceAlert[]> {
    const allAlerts = await this.getRecentAlerts(1000); // Get more to filter
    
    return allAlerts
      .filter(alert => alert.category === category)
      .slice(0, limit);
  }

  /**
   * Get alerts by severity
   */
  static async getAlertsBySeverity(
    severity: 'warning' | 'error',
    limit: number = 50
  ): Promise<PerformanceAlert[]> {
    const allAlerts = await this.getRecentAlerts(1000);
    
    return allAlerts
      .filter(alert => alert.severity === severity)
      .slice(0, limit);
  }
}