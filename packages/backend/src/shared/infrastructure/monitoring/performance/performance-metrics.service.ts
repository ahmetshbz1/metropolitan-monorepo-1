//  "performance-metrics.service.ts"
//  metropolitan backend  
//  Performance metrics collection and analysis

import { redis } from "../../database/redis";

export interface EndpointMetrics {
  requests: number;
  errors: number;
  avgResponseTime: number;
  errorRate: number;
}

export class PerformanceMetricsService {
  /**
   * Get endpoint-specific metrics
   */
  static async getEndpointMetrics(
    method: string, 
    path: string
  ): Promise<EndpointMetrics> {
    const endpointKey = `endpoint:${method}:${path}`;
    
    try {
      const [requests, errors, responseTimes] = await Promise.all([
        redis.get(`${endpointKey}:requests`),
        redis.get(`${endpointKey}:errors`),
        redis.lrange(`${endpointKey}:response_times`, 0, -1),
      ]);
      
      const requestCount = parseInt(requests || '0');
      const errorCount = parseInt(errors || '0');
      const responseTimeNumbers = responseTimes
        .map(t => parseFloat(t))
        .filter(t => !isNaN(t));
      
      const avgResponseTime = responseTimeNumbers.length > 0
        ? responseTimeNumbers.reduce((a, b) => a + b, 0) / responseTimeNumbers.length
        : 0;
      
      const errorRate = requestCount > 0 
        ? (errorCount / requestCount) * 100 
        : 0;
      
      return {
        requests: requestCount,
        errors: errorCount,
        avgResponseTime,
        errorRate,
      };
    } catch (error) {
      console.error('Failed to get endpoint metrics:', error);
      return {
        requests: 0,
        errors: 0,
        avgResponseTime: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Clear endpoint-specific metrics
   */
  static async clearEndpointMetrics(
    method: string, 
    path: string
  ): Promise<void> {
    const endpointKey = `endpoint:${method}:${path}`;
    
    try {
      await redis.del(
        `${endpointKey}:requests`,
        `${endpointKey}:errors`,
        `${endpointKey}:response_times`
      );
      console.log(`Cleared metrics for ${method} ${path}`);
    } catch (error) {
      console.error('Failed to clear endpoint metrics:', error);
    }
  }

  /**
   * Get all tracked endpoints
   */
  static async getTrackedEndpoints(): Promise<string[]> {
    try {
      const keys = await redis.keys('endpoint:*:requests');
      return keys.map(key => {
        // Extract method and path from key
        const parts = key.split(':');
        if (parts.length >= 4) {
          return `${parts[1]} ${parts.slice(2, -1).join(':')}`;
        }
        return key;
      });
    } catch (error) {
      console.error('Failed to get tracked endpoints:', error);
      return [];
    }
  }

  /**
   * Get top N slowest endpoints
   */
  static async getSlowestEndpoints(limit: number = 10): Promise<Array<{
    endpoint: string;
    avgResponseTime: number;
  }>> {
    try {
      const endpoints = await this.getTrackedEndpoints();
      const endpointMetrics = await Promise.all(
        endpoints.map(async (endpoint) => {
          const [method, ...pathParts] = endpoint.split(' ');
          const path = pathParts.join(' ');
          const metrics = await this.getEndpointMetrics(method, path);
          return {
            endpoint,
            avgResponseTime: metrics.avgResponseTime,
          };
        })
      );

      return endpointMetrics
        .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get slowest endpoints:', error);
      return [];
    }
  }

  /**
   * Get endpoints with highest error rates
   */
  static async getErrorProneEndpoints(limit: number = 10): Promise<Array<{
    endpoint: string;
    errorRate: number;
    errors: number;
    requests: number;
  }>> {
    try {
      const endpoints = await this.getTrackedEndpoints();
      const endpointMetrics = await Promise.all(
        endpoints.map(async (endpoint) => {
          const [method, ...pathParts] = endpoint.split(' ');
          const path = pathParts.join(' ');
          const metrics = await this.getEndpointMetrics(method, path);
          return {
            endpoint,
            errorRate: metrics.errorRate,
            errors: metrics.errors,
            requests: metrics.requests,
          };
        })
      );

      return endpointMetrics
        .filter(e => e.requests > 0)
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get error-prone endpoints:', error);
      return [];
    }
  }
}