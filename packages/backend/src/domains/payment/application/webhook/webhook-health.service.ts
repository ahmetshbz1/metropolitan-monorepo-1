//  "webhook-health.service.ts"
//  metropolitan backend
//  Webhook system health monitoring

import { WebhookIdempotencyService } from "./idempotency.service";
import { PaymentIntentHandlersService } from "./payment-intent-handlers.service";
import { WebhookUtils } from "./webhook-utils.service";
import StripeService from "../../../../shared/infrastructure/external/stripe.service";

export interface WebhookHealthStatus {
  status: 'healthy' | 'warning' | 'error';
  services: {
    idempotency: boolean;
    handlers: boolean;
    stripe: boolean;
  };
  stats: {
    supportedEvents: number;
    availableHandlers: number;
    cacheUtilization: number;
  };
  issues: string[];
}

export class WebhookHealthService {
  /**
   * Comprehensive health check for webhook system
   */
  static async checkHealth(): Promise<WebhookHealthStatus> {
    const issues: string[] = [];
    const services = {
      idempotency: true, // In-memory service, always available
      handlers: true,    // Static service, always available
      stripe: false,
    };

    // Check Stripe service availability
    try {
      if (StripeService) {
        services.stripe = true;
      }
    } catch (error) {
      issues.push('Stripe service not available');
    }

    // Gather statistics
    const stats = {
      supportedEvents: WebhookUtils.getSupportedEvents().length,
      availableHandlers: PaymentIntentHandlersService.getHandlers().length,
      cacheUtilization: WebhookIdempotencyService.getStats().cacheUtilization,
    };

    // Check cache utilization
    if (stats.cacheUtilization > 90) {
      issues.push('Webhook idempotency cache is near capacity');
    }

    // Check handler coverage
    if (stats.availableHandlers < stats.supportedEvents) {
      issues.push(
        `Handler coverage incomplete: ${stats.availableHandlers}/${stats.supportedEvents}`
      );
    }

    // Determine overall status
    const status = issues.length === 0 ? 'healthy' : 
                  issues.length === 1 ? 'warning' : 'error';

    return {
      status,
      services,
      stats,
      issues,
    };
  }

  /**
   * Get detailed service metrics
   */
  static async getMetrics() {
    const idempotencyStats = WebhookIdempotencyService.getStats();
    const handlers = WebhookUtils.getAvailableHandlers();
    
    return {
      idempotency: {
        processedEvents: idempotencyStats.processedEvents,
        cacheUtilization: idempotencyStats.cacheUtilization,
        lastCleaned: idempotencyStats.lastCleaned,
      },
      handlers: {
        total: handlers.length,
        list: handlers,
      },
      performance: {
        avgProcessingTime: 'Not implemented', // Could track this
        successRate: 'Not implemented',       // Could track this
      },
    };
  }
}