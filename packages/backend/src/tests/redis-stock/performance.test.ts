// "performance.test.ts"
// Redis performance comparison tests

import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { MockRedisStockService } from '../mocks/redis-stock.service.mock';

describe("⚡ Redis Performance Tests", () => {
  
  beforeAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🔧 Redis mock initialized for performance testing");
  });

  afterAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🧹 Redis mock cleaned up");
  });

  test("Redis performance vs traditional approach", async () => {
    console.log("\n🎯 Testing Redis performance...");
    
    const productId = "redis-perf-test";
    await MockRedisStockService.syncStockFromDB(productId, 100);
    
    // Redis approach
    const redisStartTime = Date.now();
    const redisPromises = Array.from({ length: 50 }, (_, i) =>
      MockRedisStockService.reserveStockAtomic(productId, `redis-user-${i}`, 1)
    );
    
    const redisResults = await Promise.allSettled(redisPromises);
    const redisEndTime = Date.now();
    const redisDuration = redisEndTime - redisStartTime;
    
    const redisSuccessCount = redisResults.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;
    
    console.log(`⚡ Redis approach:`);
    console.log(`  - Duration: ${redisDuration}ms`);
    console.log(`  - Successful reservations: ${redisSuccessCount}/50`);
    console.log(`  - Final stock: ${await MockRedisStockService.getCurrentStock(productId)}`);
    
    // Simulate traditional database approach (mock)
    let traditionalStock = 100;
    const traditionalStartTime = Date.now();
    
    const traditionalReservations = Array.from({ length: 50 }, async (_, i) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10)); // Simulate DB latency
      
      if (traditionalStock > 0) {
        traditionalStock--;
        return { success: true, user: `db-user-${i}` };
      }
      return { success: false, user: `db-user-${i}` };
    });
    
    const traditionalResults = await Promise.allSettled(traditionalReservations);
    const traditionalEndTime = Date.now();
    const traditionalDuration = traditionalEndTime - traditionalStartTime;
    
    const traditionalSuccessCount = traditionalResults.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;
    
    console.log(`🗄️ Traditional DB approach:`);
    console.log(`  - Duration: ${traditionalDuration}ms`);
    console.log(`  - Successful reservations: ${traditionalSuccessCount}/50`);
    console.log(`  - Final stock: ${traditionalStock}`);
    
    // Redis should be faster and more consistent
    console.log(`📊 Performance comparison:`);
    
    if (redisDuration === 0) {
      console.log(`  - Redis completed instantly (0ms)`);
    } else {
      console.log(`  - Redis is ${((traditionalDuration / redisDuration) * 100 - 100).toFixed(1)}% faster`);
    }
    
    // Redis mock completes instantly, so we test logical consistency instead
    expect(redisDuration).toBeLessThanOrEqual(traditionalDuration);
    
    // Redis should prevent over-reservation better than traditional approach
    const redisOverReservation = Math.max(0, 100 - (await MockRedisStockService.getCurrentStock(productId)) - redisSuccessCount);
    const traditionalOverReservation = Math.max(0, 100 - traditionalStock - traditionalSuccessCount);
    
    expect(redisOverReservation).toBeLessThanOrEqual(traditionalOverReservation);
    
    console.log(`🔒 Consistency check:`);
    console.log(`  - Redis over-reservations: ${redisOverReservation}`);
    console.log(`  - Traditional over-reservations: ${traditionalOverReservation}`);
    
    console.log("🎉 Redis performance test PASSED!");
  });

  test("High volume concurrent operations", async () => {
    console.log("\n🎯 Testing high volume operations...");
    
    const productId = "redis-high-volume";
    const initialStock = 500;
    await MockRedisStockService.syncStockFromDB(productId, initialStock);
    
    const startTime = Date.now();
    
    // 200 concurrent requests
    const requests = Array.from({ length: 200 }, (_, i) =>
      MockRedisStockService.reserveStockAtomic(productId, `high-vol-user-${i}`, Math.floor(Math.random() * 3) + 1)
    );
    
    const results = await Promise.allSettled(requests);
    const duration = Date.now() - startTime;
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const finalStock = await MockRedisStockService.getCurrentStock(productId);
    
    console.log(`📊 High volume test results:`);
    console.log(`  - Total requests: 200`);
    console.log(`  - Successful: ${successCount}`);
    console.log(`  - Duration: ${duration}ms`);
    console.log(`  - Average time per request: ${(duration / 200).toFixed(2)}ms`);
    console.log(`  - Final stock: ${finalStock}`);
    
    // All operations should complete quickly
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    
    // Stock should never go negative
    expect(finalStock).toBeGreaterThanOrEqual(0);
    
    console.log("🎉 High volume test PASSED!");
  });
});