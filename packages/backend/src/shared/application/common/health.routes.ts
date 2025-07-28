//  "health.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 10.06.2025.

import * as os from "os";

import { Elysia } from "elysia";

import { db } from "../../infrastructure/database/connection";
import { redis } from "../../infrastructure/database/redis";
import { globalLogger } from "../../infrastructure/monitoring/logger.config";

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  services: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

// Database health check
async function checkDatabase(): Promise<{
  status: "healthy" | "unhealthy";
  responseTime?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await db.execute("SELECT 1");
    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime,
    };
  } catch (error) {
    globalLogger.error("Database health check failed", error as Error);
    return {
      status: "unhealthy",
      error: (error as Error).message,
    };
  }
}

// Redis health check
async function checkRedis(): Promise<{
  status: "healthy" | "unhealthy";
  responseTime?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await redis.ping();
    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime,
    };
  } catch (error) {
    globalLogger.error("Redis health check failed", error as Error);
    return {
      status: "unhealthy",
      error: (error as Error).message,
    };
  }
}

// System info
function getSystemInfo() {
  const memoryUsage = process.memoryUsage();

  // Use RSS (Resident Set Size) for actual memory usage
  const usedMemory = memoryUsage.rss;
  const totalSystemMemory = os.totalmem();

  return {
    memory: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalSystemMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalSystemMemory) * 100),
    },
    cpu: {
      usage: Math.round(process.cpuUsage().system / 1000000), // Simplified CPU usage
    },
  };
}

export const healthRoutes = new Elysia({ prefix: "/health" })
  // Basic health check
  .get("/", async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "metropolitan-backend",
    };
  })

  // Detailed health check
  .get("/detailed", async () => {
    const startTime = Date.now();

    const [databaseHealth, redisHealth] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ]);

    const systemInfo = getSystemInfo();

    // Determine overall status
    let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

    if (
      databaseHealth.status === "unhealthy" ||
      redisHealth.status === "unhealthy"
    ) {
      overallStatus = "unhealthy";
    } else if (systemInfo.memory.percentage > 90) {
      overallStatus = "degraded";
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: databaseHealth,
        redis: redisHealth,
      },
      system: systemInfo,
    };

    // Log health check
    globalLogger.info("Health check performed", {
      status: overallStatus,
      checkDuration: Date.now() - startTime,
      databaseResponseTime: databaseHealth.responseTime,
      redisResponseTime: redisHealth.responseTime,
    });

    return healthStatus;
  })

  // Readiness probe (Kubernetes compatible)
  .get("/ready", async () => {
    const [databaseHealth, redisHealth] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ]);

    const isReady =
      databaseHealth.status === "healthy" && redisHealth.status === "healthy";

    if (!isReady) {
      return new Response(
        JSON.stringify({
          status: "not ready",
          issues: [
            ...(databaseHealth.status === "unhealthy" ? ["database"] : []),
            ...(redisHealth.status === "unhealthy" ? ["redis"] : []),
          ],
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return {
      status: "ready",
      timestamp: new Date().toISOString(),
    };
  })

  // Liveness probe (Kubernetes compatible)
  .get("/live", () => {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  });
