//  "performance-middleware.ts"
//  metropolitan backend  
//  Main performance middleware orchestrator
//  Refactored: Delegates to specialized middleware and metrics services

import { basicPerformanceMiddleware } from "./basic-performance.middleware";
import { detailedPerformanceMiddleware } from "./detailed-performance.middleware";
import { PerformanceMetricsService } from "./performance-metrics.service";

// Re-export middleware for backward compatibility
export const performanceMiddleware = basicPerformanceMiddleware;
export { detailedPerformanceMiddleware };

/**
 * Utility functions for performance middleware
 * @deprecated Use PerformanceMetricsService directly
 */
export class PerformanceMiddlewareUtils {
  /**
   * Get endpoint-specific metrics
   * @deprecated Use PerformanceMetricsService.getEndpointMetrics()
   */
  static async getEndpointMetrics(method: string, path: string) {
    return PerformanceMetricsService.getEndpointMetrics(method, path);
  }

  /**
   * Clear endpoint-specific metrics
   * @deprecated Use PerformanceMetricsService.clearEndpointMetrics()
   */
  static async clearEndpointMetrics(method: string, path: string) {
    return PerformanceMetricsService.clearEndpointMetrics(method, path);
  }

  /**
   * Get all tracked endpoints
   * @deprecated Use PerformanceMetricsService.getTrackedEndpoints()
   */
  static async getTrackedEndpoints() {
    return PerformanceMetricsService.getTrackedEndpoints();
  }
}

// Export metrics service for direct usage
export { PerformanceMetricsService };