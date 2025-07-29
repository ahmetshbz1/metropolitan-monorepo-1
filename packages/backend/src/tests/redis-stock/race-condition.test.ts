// "race-condition.test.ts"
// Redis race condition prevention tests

import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { MockRedisStockService } from '../mocks/redis-stock.service.mock';

describe("🚨 Redis Race Condition Prevention Tests", () => {
  
  beforeAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🔧 Redis mock initialized for race condition testing");
  });

  afterAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🧹 Redis mock cleaned up");
  });

  test("Redis-based race condition prevention", async () => {
    console.log("\n🎯 Testing Redis distributed locking...");
    
    const productId = "redis-test-product-1";
    await MockRedisStockService.syncStockFromDB(productId, 1);
    
    console.log(`📦 Initial stock: ${await MockRedisStockService.getCurrentStock(productId)}`);
    
    // Simulate concurrent reservations
    const [result1, result2] = await Promise.allSettled([
      MockRedisStockService.reserveStockAtomic(productId, "user-1", 1),
      MockRedisStockService.reserveStockAtomic(productId, "user-2", 1)
    ]);

    console.log("📊 Redis race condition results:");
    
    const successCount = [result1, result2].filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;
    
    const failureCount = [result1, result2].filter(
      r => r.status === 'fulfilled' && !r.value.success
    ).length;
    
    console.log(`✅ Successful reservations: ${successCount}`);
    console.log(`❌ Failed reservations: ${failureCount}`);
    console.log(`📦 Final stock: ${await MockRedisStockService.getCurrentStock(productId)}`);
    
    // Assertions
    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);
    expect(await MockRedisStockService.getCurrentStock(productId)).toBe(0);
    
    console.log("🎉 Redis race condition prevention PASSED!");
  });

  test("Multiple concurrent requests on same product", async () => {
    console.log("\n🎯 Testing multiple concurrent requests...");
    
    const productId = "redis-concurrent-test";
    const initialStock = 5;
    await MockRedisStockService.syncStockFromDB(productId, initialStock);
    
    // 10 users trying to reserve 1 item each
    const userRequests = Array.from({ length: 10 }, (_, i) =>
      MockRedisStockService.reserveStockAtomic(productId, `user-${i}`, 1)
    );
    
    const results = await Promise.allSettled(userRequests);
    const successfulReservations = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;
    
    console.log(`✅ Successful reservations: ${successfulReservations}/${userRequests.length}`);
    console.log(`📦 Final stock: ${await MockRedisStockService.getCurrentStock(productId)}`);
    
    // Should have exactly 5 successful reservations
    expect(successfulReservations).toBe(initialStock);
    expect(await MockRedisStockService.getCurrentStock(productId)).toBe(0);
    
    console.log("🎉 Multiple concurrent requests test PASSED!");
  });
});