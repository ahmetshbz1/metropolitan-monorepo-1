//  "alert-storage.service.ts"
//  metropolitan backend
//  Alert storage and retrieval service

import { redis } from "../../database/redis";
import type { PerformanceAlert } from "./performance-types";
import { PERFORMANCE_CONFIG } from "./performance-types";

export class AlertStorageService {
  private static readonly MAX_ALERTS = 1000;
  
  /**
   * Store alerts in Redis
   */
  static async storeAlerts(alerts: PerformanceAlert[]): Promise<void> {
    if (alerts.length === 0) return;
    
    // Log alerts to console with emoji indicators
    this.logAlerts(alerts);
    
    // Store alerts in Redis for dashboard
    const serializedAlerts = alerts.map(alert => JSON.stringify(alert));
    await redis.lpush(PERFORMANCE_CONFIG.REDIS_KEYS.ALERTS, ...serializedAlerts);
    
    // Keep only recent alerts
    await redis.ltrim(PERFORMANCE_CONFIG.REDIS_KEYS.ALERTS, 0, this.MAX_ALERTS - 1);
  }
  
  /**
   * Get recent alerts from Redis
   */
  static async getRecentAlerts(limit: number = 50): Promise<PerformanceAlert[]> {
    const alerts = await redis.lrange(PERFORMANCE_CONFIG.REDIS_KEYS.ALERTS, 0, limit - 1);
    
    return alerts
      .map(alertString => this.parseAlert(alertString))
      .filter(Boolean) as PerformanceAlert[];
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
    const allAlerts = await this.getRecentAlerts(1000);
    
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
  
  private static logAlerts(alerts: PerformanceAlert[]): void {
    const formattedAlerts = alerts.map(alert => {
      const icon = alert.severity === 'error' ? '🚨' : '⚠️';
      return `${icon} ${alert.alert}`;
    });
    
    console.error("Performance alerts:", formattedAlerts);
  }
  
  private static parseAlert(alertString: string): PerformanceAlert | null {
    try {
      return JSON.parse(alertString) as PerformanceAlert;
    } catch (error) {
      console.warn('Failed to parse alert:', alertString);
      return null;
    }
  }
}