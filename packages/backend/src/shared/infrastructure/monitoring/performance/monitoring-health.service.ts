// "monitoring-health.service.ts"
// metropolitan backend  
// Health check and monitoring status service

import { redis } from "../../database/redis";
import { MetricsCollectionService } from "./metrics-collection.service";

export interface MonitoringHealthStatus {
  status: 'healthy' | 'warning' | 'error';
  monitoring: boolean;
  services: {
    redis: boolean;
    database: boolean;
    metrics: boolean;
  };
  issues: string[];
}

export class MonitoringHealthService {
  /**
   * Perform comprehensive health check of the monitoring system
   */
  static async performHealthCheck(isMonitoring: boolean): Promise<MonitoringHealthStatus> {
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
      monitoring: isMonitoring,
      services,
      issues,
    };
  }

  /**
   * Check individual service health
   */
  static async checkRedisHealth(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  static async checkMetricsHealth(): Promise<boolean> {
    try {
      await MetricsCollectionService.getAPIMetricsOnly();
      return true;
    } catch {
      return false;
    }
  }

  static async checkDatabaseHealth(): Promise<boolean> {
    try {
      await MetricsCollectionService.getDatabaseMetricsOnly();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get monitoring system diagnostics
   */
  static async getDiagnostics(): Promise<{
    timestamp: string;
    uptime: number;
    services: MonitoringHealthStatus['services'];
    recentErrors: string[];
  }> {
    const [redisHealth, metricsHealth, databaseHealth] = await Promise.all([
      this.checkRedisHealth(),
      this.checkMetricsHealth(),
      this.checkDatabaseHealth(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: redisHealth,
        metrics: metricsHealth,
        database: databaseHealth,
      },
      recentErrors: [], // Could be extended to track recent errors
    };
  }
}