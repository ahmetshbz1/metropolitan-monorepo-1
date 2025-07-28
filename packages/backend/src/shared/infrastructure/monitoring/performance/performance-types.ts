//  "performance-types.ts"
//  metropolitan backend  
//  Performance monitoring types and configuration
//  Extracted from performance-monitor.ts for better modularity

export interface PerformanceMetrics {
  timestamp: number;
  api: APIMetrics;
  database: DatabaseMetrics;
  redis: RedisMetrics;
  system: SystemMetrics;
}

export interface APIMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeConnections: number;
}

export interface DatabaseMetrics {
  queryTime: number;
  connectionPoolUsage: number;
  slowQueries: number;
  deadlocks: number;
}

export interface RedisMetrics {
  hitRate: number;
  evictionRate: number;
  memoryUsage: number;
  latency: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  networkIO: number;
}

export interface PerformanceAlert {
  alert: string;
  timestamp: number;
  severity: 'warning' | 'error';
  category: 'api' | 'database' | 'redis' | 'system';
}

export interface PerformanceReport {
  duration: number;
  sampleCount: number;
  averages: {
    api: Partial<APIMetrics>;
    database: Partial<DatabaseMetrics>;
    redis: Partial<RedisMetrics>;
  };
  current: PerformanceMetrics;
  alerts: PerformanceAlert[];
}

export interface PerformanceThresholds {
  api: {
    responseTime: number;
    errorRate: number;
  };
  database: {
    queryTime: number;
    connectionPoolUsage: number;
    deadlocks: number;
  };
  redis: {
    hitRate: number;
    memoryUsage: number;
    latency: number;
  };
  system: {
    memoryUsage: number;
  };
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  api: {
    responseTime: 500, // ms
    errorRate: 5, // %
  },
  database: {
    queryTime: 100, // ms
    connectionPoolUsage: 80, // %
    deadlocks: 0, // count
  },
  redis: {
    hitRate: 80, // %
    memoryUsage: 80, // %
    latency: 10, // ms
  },
  system: {
    memoryUsage: 90, // %
  },
};

export const PERFORMANCE_CONFIG = {
  MAX_METRICS_HISTORY: 1000,
  DEFAULT_MONITORING_INTERVAL: 5000, // ms
  REDIS_KEYS: {
    METRICS: 'performance:metrics',
    ALERTS: 'performance:alerts',
    API_RESPONSE_TIMES: 'api:response_times',
    API_TOTAL_REQUESTS: 'api:total_requests',
    API_ERROR_REQUESTS: 'api:error_requests',
    API_ACTIVE_CONNECTIONS: 'api:active_connections',
  },
  REDIS_TTL: {
    METRICS: 3600, // 1 hour
    ALERTS: 86400, // 24 hours
  },
} as const;