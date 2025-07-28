//  "query-optimizer.ts"
//  metropolitan backend
//  Database query optimization utilities

import { sql } from "drizzle-orm";
import { db } from "./connection";

export class QueryOptimizer {
  /**
   * Analyze query performance and suggest optimizations
   */
  static async analyzeQuery(query: string): Promise<{
    executionTime: number;
    plan: any;
    suggestions: string[];
  }> {
    const startTime = process.hrtime.bigint();
    
    // Get query execution plan
    const explainResult = await db.execute(sql`EXPLAIN ANALYZE ${sql.raw(query)}`);
    
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to ms
    
    // Parse execution plan for optimization suggestions
    const suggestions = this.generateSuggestions(explainResult);
    
    return {
      executionTime,
      plan: explainResult,
      suggestions,
    };
  }
  
  /**
   * Generate optimization suggestions based on query plan
   */
  private static generateSuggestions(plan: any): string[] {
    const suggestions: string[] = [];
    const planText = JSON.stringify(plan);
    
    // Check for common performance issues
    if (planText.includes("Seq Scan") && !planText.includes("Index Scan")) {
      suggestions.push("Consider adding indexes to avoid sequential scans");
    }
    
    if (planText.includes("Nested Loop") && planText.includes("rows=") && parseInt(planText.match(/rows=(\d+)/)?.[1] || "0") > 1000) {
      suggestions.push("Large nested loops detected - consider using hash joins or optimizing join conditions");
    }
    
    if (planText.includes("Sort") && !planText.includes("Index Scan")) {
      suggestions.push("Consider adding indexes on ORDER BY columns to avoid sorting");
    }
    
    if (planText.includes("Filter") && planText.includes("Rows Removed by Filter")) {
      suggestions.push("Many rows filtered after retrieval - consider adding WHERE clause indexes");
    }
    
    return suggestions;
  }
  
  /**
   * Batch operations for better performance
   */
  static createBatchProcessor<T, R>(
    batchSize: number = 100,
    processFunction: (items: T[]) => Promise<R[]>
  ) {
    let batch: T[] = [];
    let batchPromise: Promise<R[]> | null = null;
    let batchTimer: Timer | null = null;
    
    const processBatch = async () => {
      if (batch.length === 0) return [];
      
      const currentBatch = [...batch];
      batch = [];
      
      return processFunction(currentBatch);
    };
    
    const scheduleBatch = () => {
      if (batchTimer) clearTimeout(batchTimer);
      
      batchTimer = setTimeout(() => {
        batchPromise = processBatch();
      }, 10); // Process after 10ms of inactivity
    };
    
    return {
      add: async (item: T): Promise<R> => {
        batch.push(item);
        
        if (batch.length >= batchSize) {
          // Process immediately if batch is full
          const results = await processBatch();
          return results[results.length - 1];
        }
        
        // Schedule batch processing
        scheduleBatch();
        
        // Wait for batch to complete
        if (!batchPromise) {
          batchPromise = new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (batchPromise) {
                clearInterval(checkInterval);
                resolve(batchPromise);
              }
            }, 5);
          });
        }
        
        const results = await batchPromise;
        return results[batch.length - 1];
      },
      
      flush: async (): Promise<R[]> => {
        if (batchTimer) clearTimeout(batchTimer);
        return processBatch();
      },
    };
  }
  
  /**
   * Connection pool statistics
   */
  static async getPoolStats(): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingRequests: number;
  }> {
    // Get connection pool stats from PostgreSQL
    const result = await db.execute(sql`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE wait_event_type = 'Client') as waiting_requests
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    
    const stats = result.rows[0] as any;
    
    return {
      totalConnections: parseInt(stats.total_connections),
      idleConnections: parseInt(stats.idle_connections),
      waitingRequests: parseInt(stats.waiting_requests),
    };
  }
  
  /**
   * Optimize bulk inserts with COPY
   */
  static async bulkInsert<T extends Record<string, any>>(
    tableName: string,
    data: T[],
    columns: (keyof T)[]
  ): Promise<void> {
    if (data.length === 0) return;
    
    // Convert data to CSV format for COPY command
    const csvData = data.map(row => 
      columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '\\N';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return String(value);
      }).join(',')
    ).join('\n');
    
    // Use COPY for efficient bulk insert
    await db.execute(sql`
      COPY ${sql.identifier(tableName)} (${sql.raw(columns.join(', '))})
      FROM STDIN WITH (FORMAT csv, NULL '\\N')
    `.append(sql.raw(csvData)));
  }
  
  /**
   * Query result caching with automatic invalidation
   */
  static createQueryCache<T>(
    cacheKey: string,
    ttl: number = 300 // 5 minutes default
  ) {
    return {
      execute: async (
        queryFn: () => Promise<T>,
        invalidationTags?: string[]
      ): Promise<T> => {
        // Try to get from cache first
        const { ApiCacheService } = await import("../cache/api-cache.service");
        
        const cached = await ApiCacheService.get<T>(cacheKey);
        if (cached) return cached;
        
        // Execute query
        const result = await queryFn();
        
        // Cache the result
        await ApiCacheService.set(cacheKey, result, {
          ttl,
          tags: invalidationTags,
        });
        
        return result;
      },
      
      invalidate: async () => {
        const { ApiCacheService } = await import("../cache/api-cache.service");
        await ApiCacheService.invalidatePattern(cacheKey);
      },
    };
  }
}