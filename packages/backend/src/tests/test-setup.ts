//  "test-setup.ts"
//  metropolitan backend
//  Global test setup and utilities

import { db } from "../shared/infrastructure/database/connection";
import { redis } from "../shared/infrastructure/database/redis";

export class TestSetup {
  /**
   * Verify test database connection
   */
  static async verifyDatabase(): Promise<boolean> {
    try {
      await db.execute("SELECT 1");
      console.log("✅ Database connection verified");
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      return false;
    }
  }

  /**
   * Verify Redis connection
   */
  static async verifyRedis(): Promise<boolean> {
    try {
      await redis.ping();
      console.log("✅ Redis connection verified");
      return true;
    } catch (error) {
      console.error("❌ Redis connection failed:", error);
      return false;
    }
  }

  /**
   * Clean test data from Redis
   */
  static async cleanRedisTestData(): Promise<void> {
    try {
      const testKeys = await redis.keys("*TEST*");
      if (testKeys.length > 0) {
        await redis.del(...testKeys);
        console.log(`🧹 Cleaned ${testKeys.length} test keys from Redis`);
      }
    } catch (error) {
      console.error("⚠️ Redis cleanup failed:", error);
    }
  }

  /**
   * Verify all system components
   */
  static async verifySystemHealth(): Promise<{
    database: boolean;
    redis: boolean;
    healthy: boolean;
  }> {
    const database = await this.verifyDatabase();
    const redis = await this.verifyRedis();

    return {
      database,
      redis,
      healthy: database && redis,
    };
  }

  /**
   * Pre-test validation
   */
  static async beforeAllTests(): Promise<void> {
    console.log("\n🔧 Running pre-test setup...\n");

    const health = await this.verifySystemHealth();

    if (!health.healthy) {
      throw new Error(
        "System health check failed. Please ensure database and Redis are running."
      );
    }

    await this.cleanRedisTestData();
    console.log("✅ Pre-test setup completed\n");
  }

  /**
   * Post-test cleanup
   */
  static async afterAllTests(): Promise<void> {
    console.log("\n🧹 Running post-test cleanup...\n");
    await this.cleanRedisTestData();
    console.log("✅ Post-test cleanup completed\n");
  }
}

// Kullanım örneği:
// beforeAll(async () => {
//   await TestSetup.beforeAllTests();
// });
//
// afterAll(async () => {
//   await TestSetup.afterAllTests();
// });
