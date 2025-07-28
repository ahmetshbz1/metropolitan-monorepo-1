//  "performance-monitor.ts"
//  metropolitan backend
//  Real-time performance monitoring and alerting

import { Elysia } from "elysia";
import { redis } from "../database/redis";
import { db } from "../database/connection";
import { sql } from "drizzle-orm";

interface PerformanceMetrics {
  timestamp: number;
  api: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    activeConnections: number;
  };
  database: {
    queryTime: number;
    connectionPoolUsage: number;
    slowQueries: number;
    deadlocks: number;
  };
  redis: {
    hitRate: number;
    evictionRate: number;
    memoryUsage: number;
    latency: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskIO: number;
    networkIO: number;
  };
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS_HISTORY = 1000;
  private static monitoringInterval: Timer | null = null;
  
  /**
   * Start performance monitoring
   */
  static start(intervalMs: number = 5000) {
    if (this.monitoringInterval) {
      console.warn("Performance monitoring already started");
      return;
    }
    
    console.log("🚀 Starting performance monitoring...");
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        
        // Keep only recent metrics
        if (this.metrics.length > this.MAX_METRICS_HISTORY) {
          this.metrics = this.metrics.slice(-this.MAX_METRICS_HISTORY);
        }
        
        // Check for performance issues
        await this.checkThresholds(metrics);
        
        // Store metrics in Redis for distributed monitoring
        await redis.setex(
          `performance:metrics:${Date.now()}`,
          3600, // 1 hour TTL
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
  
  /**
   * Collect current performance metrics
   */
  private static async collectMetrics(): Promise<PerformanceMetrics> {
    const [apiMetrics, dbMetrics, redisMetrics, systemMetrics] = await Promise.all([
      this.getAPIMetrics(),
      this.getDatabaseMetrics(),
      this.getRedisMetrics(),
      this.getSystemMetrics(),
    ]);
    
    return {
      timestamp: Date.now(),
      api: apiMetrics,
      database: dbMetrics,
      redis: redisMetrics,
      system: systemMetrics,
    };
  }
  
  /**
   * Get API performance metrics
   */
  private static async getAPIMetrics() {
    // Get response times from recent requests
    const recentRequests = await redis.lrange("api:response_times", -100, -1);
    const responseTimes = recentRequests.map(t => parseFloat(t));
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    // Get error rate
    const totalRequests = parseInt(await redis.get("api:total_requests") || "0");
    const errorRequests = parseInt(await redis.get("api:error_requests") || "0");
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    
    return {
      responseTime: avgResponseTime,
      throughput: responseTimes.length, // Requests in last sampling period
      errorRate,
      activeConnections: parseInt(await redis.get("api:active_connections") || "0"),
    };
  }
  
  /**
   * Get database performance metrics
   */
  private static async getDatabaseMetrics() {
    // Get query statistics
    const queryStats = await db.execute(sql`
      SELECT 
        AVG(mean_exec_time) as avg_query_time,
        COUNT(*) FILTER (WHERE mean_exec_time > 100) as slow_queries,
        SUM(calls) as total_queries
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
    `);
    
    // Get connection pool stats
    const poolStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        COUNT(*) FILTER (WHERE wait_event_type = 'Lock') as waiting_on_locks
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    
    // Get deadlock count
    const deadlocks = await db.execute(sql`
      SELECT deadlocks 
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);
    
    const stats = queryStats[0] as any;
    const pool = poolStats[0] as any;
    const dl = deadlocks[0] as any;
    
    return {
      queryTime: parseFloat(stats?.avg_query_time || 0),
      connectionPoolUsage: (parseInt(pool?.active_connections || 0) / 20) * 100, // Assuming max 20 connections
      slowQueries: parseInt(stats?.slow_queries || 0),
      deadlocks: parseInt(dl?.deadlocks || 0),
    };
  }
  
  /**
   * Get Redis performance metrics
   */
  private static async getRedisMetrics() {
    const info = await redis.info();
    
    // Parse Redis info
    const stats = {
      hitRate: 0,
      evictionRate: 0,
      memoryUsage: 0,
      latency: 0,
    };
    
    // Extract hit rate
    const keyspaceHits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || "0");
    const keyspaceMisses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || "0");
    const totalOps = keyspaceHits + keyspaceMisses;
    
    if (totalOps > 0) {
      stats.hitRate = (keyspaceHits / totalOps) * 100;
    }
    
    // Extract eviction rate
    const evictedKeys = parseInt(info.match(/evicted_keys:(\d+)/)?.[1] || "0");
    stats.evictionRate = evictedKeys; // Total evictions
    
    // Extract memory usage
    const usedMemory = parseInt(info.match(/used_memory:(\d+)/)?.[1] || "0");
    const maxMemory = parseInt(info.match(/maxmemory:(\d+)/)?.[1] || "1073741824"); // 1GB default
    stats.memoryUsage = (usedMemory / maxMemory) * 100;
    
    // Measure latency
    const start = Date.now();
    await redis.ping();
    stats.latency = Date.now() - start;
    
    return stats;
  }
  
  /**
   * Get system performance metrics
   */
  private static async getSystemMetrics() {
    // Bun doesn't have direct access to system metrics, so we'll use approximations
    const memoryUsage = process.memoryUsage();
    
    return {
      cpuUsage: 0, // Would need OS-specific implementation
      memoryUsage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      diskIO: 0, // Would need OS-specific implementation
      networkIO: 0, // Would need OS-specific implementation
    };
  }
  
  /**
   * Check performance thresholds and alert if needed
   */
  private static async checkThresholds(metrics: PerformanceMetrics) {
    const alerts: string[] = [];
    
    // API thresholds
    if (metrics.api.responseTime > 500) {
      alerts.push(`⚠️ High API response time: ${metrics.api.responseTime.toFixed(2)}ms`);
    }
    if (metrics.api.errorRate > 5) {
      alerts.push(`🚨 High API error rate: ${metrics.api.errorRate.toFixed(2)}%`);
    }
    
    // Database thresholds
    if (metrics.database.queryTime > 100) {
      alerts.push(`⚠️ Slow database queries: ${metrics.database.queryTime.toFixed(2)}ms avg`);
    }
    if (metrics.database.connectionPoolUsage > 80) {
      alerts.push(`🚨 High connection pool usage: ${metrics.database.connectionPoolUsage.toFixed(2)}%`);
    }
    if (metrics.database.deadlocks > 0) {
      alerts.push(`🚨 Database deadlocks detected: ${metrics.database.deadlocks}`);
    }
    
    // Redis thresholds
    if (metrics.redis.hitRate < 80) {
      alerts.push(`⚠️ Low Redis hit rate: ${metrics.redis.hitRate.toFixed(2)}%`);
    }
    if (metrics.redis.memoryUsage > 80) {
      alerts.push(`🚨 High Redis memory usage: ${metrics.redis.memoryUsage.toFixed(2)}%`);
    }
    if (metrics.redis.latency > 10) {
      alerts.push(`⚠️ High Redis latency: ${metrics.redis.latency}ms`);
    }
    
    // System thresholds
    if (metrics.system.memoryUsage > 90) {
      alerts.push(`🚨 High memory usage: ${metrics.system.memoryUsage.toFixed(2)}%`);
    }
    
    // Log alerts
    if (alerts.length > 0) {
      console.error("Performance alerts:", alerts);
      
      // Store alerts in Redis for dashboard
      await redis.lpush("performance:alerts", ...alerts.map(alert => 
        JSON.stringify({ alert, timestamp: Date.now() })
      ));
      
      // Keep only recent alerts
      await redis.ltrim("performance:alerts", 0, 999);
    }
  }
  
  /**
   * Get performance report
   */
  static async getReport(duration: number = 3600000) { // 1 hour default
    const now = Date.now();
    const startTime = now - duration;
    
    // Filter metrics within duration
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= startTime);
    
    if (relevantMetrics.length === 0) {
      return { error: "No metrics available for the specified duration" };
    }
    
    // Calculate aggregates
    const avgMetrics = {
      api: {
        responseTime: this.average(relevantMetrics.map(m => m.api.responseTime)),
        throughput: this.average(relevantMetrics.map(m => m.api.throughput)),
        errorRate: this.average(relevantMetrics.map(m => m.api.errorRate)),
      },
      database: {
        queryTime: this.average(relevantMetrics.map(m => m.database.queryTime)),
        connectionPoolUsage: this.average(relevantMetrics.map(m => m.database.connectionPoolUsage)),
        slowQueries: this.sum(relevantMetrics.map(m => m.database.slowQueries)),
      },
      redis: {
        hitRate: this.average(relevantMetrics.map(m => m.redis.hitRate)),
        memoryUsage: this.average(relevantMetrics.map(m => m.redis.memoryUsage)),
        latency: this.average(relevantMetrics.map(m => m.redis.latency)),
      },
    };
    
    // Get recent alerts
    const alerts = await redis.lrange("performance:alerts", 0, 49);
    
    return {
      duration,
      sampleCount: relevantMetrics.length,
      averages: avgMetrics,
      current: relevantMetrics[relevantMetrics.length - 1],
      alerts: alerts.map(a => JSON.parse(a)),
    };
  }
  
  private static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  
  private static sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }
}

// Performance monitoring middleware
export const performanceMiddleware = new Elysia()
  .onBeforeHandle(({ request, set, store }) => {
    // Track request start time
    store.requestStartTime = Date.now();
    
    // Increment active connections
    redis.incr("api:active_connections");
  })
  .onAfterHandle(({ store, set }) => {
    // Calculate response time
    const responseTime = Date.now() - (store.requestStartTime as number);
    
    // Store response time
    redis.lpush("api:response_times", responseTime.toString());
    redis.ltrim("api:response_times", 0, 999); // Keep last 1000
    
    // Increment total requests
    redis.incr("api:total_requests");
    
    // Add performance headers
    set.headers["X-Response-Time"] = `${responseTime}ms`;
    
    // Decrement active connections
    redis.decr("api:active_connections");
  })
  .onError(({ store }) => {
    // Increment error count
    redis.incr("api:error_requests");
    
    // Decrement active connections on error
    redis.decr("api:active_connections");
  });