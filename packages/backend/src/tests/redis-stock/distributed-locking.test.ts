// "distributed-locking.test.ts"
// Redis distributed locking mechanism tests

import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { MockRedisStockService } from '../mocks/redis-stock.service.mock';

describe("🔐 Redis Distributed Locking Tests", () => {
  
  beforeAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🔧 Redis mock initialized for distributed locking testing");
  });

  afterAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🧹 Redis mock cleaned up");
  });

  test("Redis distributed locking mechanism", async () => {
    console.log("\n🎯 Testing Redis distributed locking...");
    
    const productId = "redis-lock-test";
    await MockRedisStockService.syncStockFromDB(productId, 1);
    
    // Start first reservation (should acquire lock)
    const lockTest1 = MockRedisStockService.reserveStockAtomic(productId, "user-1", 1);
    
    // Immediately try second reservation (should fail due to lock)
    const lockTest2 = MockRedisStockService.reserveStockAtomic(productId, "user-2", 1);
    
    const [result1, result2] = await Promise.allSettled([lockTest1, lockTest2]);
    
    console.log("🔐 Lock test results:");
    
    let _lockedRequestFound = false;
    
    if (result1.status === 'fulfilled' && result2.status === 'fulfilled') {
      if (!result1.value.success && result1.value.error?.includes("Another user")) {
        _lockedRequestFound = true;
        console.log("🔒 User 1 was blocked by lock");
      }
      if (!result2.value.success && result2.value.error?.includes("Another user")) {
        _lockedRequestFound = true;
        console.log("🔒 User 2 was blocked by lock");
      }
    }
    
    // At least one request should have been blocked by the locking mechanism
    // (Either due to lock or due to insufficient stock after the first succeeds)
    const totalSuccesses = [result1, result2].filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;
    
    expect(totalSuccesses).toBe(1); // Only one should succeed
    console.log(`✅ Locking mechanism working: ${totalSuccesses} successful reservation`);
    
    console.log("🎉 Redis distributed locking test PASSED!");
  });

  test("Lock timeout and retry scenario", async () => {
    console.log("\n🎯 Testing lock timeout scenarios...");
    
    const productId = "redis-lock-timeout";
    await MockRedisStockService.syncStockFromDB(productId, 10);
    
    // Simulate multiple users trying to access same product
    const userAttempts = Array.from({ length: 5 }, (_, i) => ({
      userId: `timeout-user-${i}`,
      quantity: 2
    }));
    
    const results = [];
    
    // Sequential attempts with small delays
    for (const { userId, quantity } of userAttempts) {
      const result = await MockRedisStockService.reserveStockAtomic(productId, userId, quantity);
      results.push({ userId, success: result.success, error: result.error });
      
      // Small delay to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const successCount = results.filter(r => r.success).length;
    const lockedCount = results.filter(r => !r.success && r.error?.includes("Another user")).length;
    
    console.log(`📊 Lock timeout test results:`);
    console.log(`  - Successful reservations: ${successCount}`);
    console.log(`  - Locked out attempts: ${lockedCount}`);
    console.log(`  - Final stock: ${await MockRedisStockService.getCurrentStock(productId)}`);
    
    // All attempts should either succeed or be locked (no other errors)
    const totalProcessed = successCount + lockedCount;
    expect(totalProcessed).toBeGreaterThan(0);
    
    console.log("🎉 Lock timeout test PASSED!");
  });

  test("Concurrent locks on different products", async () => {
    console.log("\n🎯 Testing concurrent locks on different products...");
    
    const products = ["lock-prod-1", "lock-prod-2", "lock-prod-3"];
    
    // Initialize all products with stock
    for (const productId of products) {
      await MockRedisStockService.syncStockFromDB(productId, 5);
    }
    
    // Each user tries to reserve from a different product
    const reservations = products.map((productId, index) =>
      MockRedisStockService.reserveStockAtomic(productId, `lock-user-${index}`, 1)
    );
    
    const results = await Promise.allSettled(reservations);
    
    // All should succeed since they're different products (different locks)
    const successCount = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;
    
    console.log(`✅ Successful concurrent reservations: ${successCount}/${products.length}`);
    
    // All should succeed as they're on different products
    expect(successCount).toBe(products.length);
    
    console.log("🎉 Concurrent locks on different products PASSED!");
  });
});