//  "metrics-collection.service.ts"
//  metropolitan backend  
//  Focused service for collecting performance metrics from various sources
//  Extracted from performance-monitor.ts (lines 113-231)

import { sql } from "drizzle-orm";
import { db } from "../../database/connection";
import { redis } from "../../database/redis";
import type { 
  APIMetrics, 
  DatabaseMetrics, 
  RedisMetrics, 
  SystemMetrics,
  PerformanceMetrics
} from "./performance-types";
import { PERFORMANCE_CONFIG } from "./performance-types";

export class MetricsCollectionService {
  
  /**
   * Collect all performance metrics from different sources
   */
  static async collectAllMetrics(): Promise<PerformanceMetrics> {
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
   * Get API performance metrics from Redis tracking
   */
  static async getAPIMetrics(): Promise<APIMetrics> {
    const keys = PERFORMANCE_CONFIG.REDIS_KEYS;
    
    // Get response times from recent requests
    const recentRequests = await redis.lrange(keys.API_RESPONSE_TIMES, -100, -1);
    const responseTimes = recentRequests.map(t => parseFloat(t)).filter(t => !isNaN(t));
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    // Get error rate
    const totalRequests = parseInt(await redis.get(keys.API_TOTAL_REQUESTS) || "0");
    const errorRequests = parseInt(await redis.get(keys.API_ERROR_REQUESTS) || "0");
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    
    return {
      responseTime: avgResponseTime,
      throughput: responseTimes.length, // Requests in last sampling period
      errorRate,
      activeConnections: parseInt(await redis.get(keys.API_ACTIVE_CONNECTIONS) || "0"),
    };
  }

  /**
   * Get database performance metrics using PostgreSQL statistics
   */
  static async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get query statistics from pg_stat_statements
      const queryStats = await db.execute(sql`
        SELECT 
          AVG(mean_exec_time) as avg_query_time,
          COUNT(*) FILTER (WHERE mean_exec_time > 100) as slow_queries,
          SUM(calls) as total_queries
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
      `);
      
      // Get connection pool statistics
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
    } catch (error) {
      console.error('Failed to collect database metrics:', error);
      return {
        queryTime: 0,
        connectionPoolUsage: 0,
        slowQueries: 0,
        deadlocks: 0,
      };
    }
  }

  /**
   * Get Redis performance metrics from Redis INFO command
   */
  static async getRedisMetrics(): Promise<RedisMetrics> {
    try {
      const info = await redis.info();
      
      // Initialize stats object
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
      stats.memoryUsage = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;
      
      // Measure latency
      const start = Date.now();
      await redis.ping();
      stats.latency = Date.now() - start;
      
      return stats;
    } catch (error) {
      console.error('Failed to collect Redis metrics:', error);
      return {
        hitRate: 0,
        evictionRate: 0,
        memoryUsage: 0,
        latency: 0,
      };
    }
  }

  /**
   * Get system performance metrics (Bun/Node.js process metrics)
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get Node.js/Bun process memory usage
      const memoryUsage = process.memoryUsage();
      
      return {
        cpuUsage: 0, // Would need OS-specific implementation or external library
        memoryUsage: memoryUsage.heapTotal > 0 ? (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100 : 0,
        diskIO: 0, // Would need OS-specific implementation
        networkIO: 0, // Would need OS-specific implementation
      };
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskIO: 0,
        networkIO: 0,
      };
    }
  }

  /**
   * Get specific metric category only (for targeted monitoring)
   */
  static async getAPIMetricsOnly(): Promise<APIMetrics> {
    return this.getAPIMetrics();
  }

  static async getDatabaseMetricsOnly(): Promise<DatabaseMetrics> {
    return this.getDatabaseMetrics();
  }

  static async getRedisMetricsOnly(): Promise<RedisMetrics> {
    return this.getRedisMetrics();
  }

  static async getSystemMetricsOnly(): Promise<SystemMetrics> {
    return this.getSystemMetrics();
  }
}