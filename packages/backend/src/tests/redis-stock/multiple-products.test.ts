// "multiple-products.test.ts"
// Redis multiple products concurrent operations tests

import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { MockRedisStockService } from '../mocks/redis-stock.service.mock';

describe("🎪 Multiple Products Concurrent Operations", () => {
  
  beforeAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🔧 Redis mock initialized for multiple products testing");
  });

  afterAll(async () => {
    MockRedisStockService.clearRedis();
    console.log("🧹 Redis mock cleaned up");
  });

  test("Multiple products concurrent Redis operations", async () => {
    console.log("\n🎯 Testing multiple products with Redis...");
    
    const products = [
      { id: "redis-multi-1", stock: 3 },
      { id: "redis-multi-2", stock: 1 },
      { id: "redis-multi-3", stock: 2 }
    ];
    
    // Initialize stocks
    for (const product of products) {
      await MockRedisStockService.syncStockFromDB(product.id, product.stock);
    }
    
    // Multiple users trying to reserve different combinations
    const users = [
      { id: "user-1", reservations: [
        { productId: "redis-multi-1", quantity: 2 },
        { productId: "redis-multi-2", quantity: 1 }
      ]},
      { id: "user-2", reservations: [
        { productId: "redis-multi-1", quantity: 1 },
        { productId: "redis-multi-2", quantity: 1 },
        { productId: "redis-multi-3", quantity: 1 }
      ]},
      { id: "user-3", reservations: [
        { productId: "redis-multi-3", quantity: 2 }
      ]}
    ];
    
    const userReservations = users.map(async (user) => {
      const results = [];
      for (const reservation of user.reservations) {
        const result = await MockRedisStockService.reserveStockAtomic(
          reservation.productId,
          user.id,
          reservation.quantity
        );
        results.push({ ...reservation, success: result.success });
      }
      return { userId: user.id, results };
    });
    
    const allResults = await Promise.allSettled(userReservations);
    
    console.log("📊 Multiple products Redis results:");
    for (const result of allResults) {
      if (result.status === 'fulfilled') {
        const { userId, results } = result.value;
        const successCount = results.filter(r => r.success).length;
        console.log(`👤 ${userId}: ${successCount}/${results.length} successful reservations`);
      }
    }
    
    // Check final stocks
    for (const product of products) {
      const finalStock = await MockRedisStockService.getCurrentStock(product.id);
      console.log(`📦 ${product.id} final stock: ${finalStock}`);
    }
    
    // Product 2 (stock: 1) should be contested - only one user should get it
    const product2Stock = await MockRedisStockService.getCurrentStock("redis-multi-2");
    expect(product2Stock).toBe(0); // Should be fully reserved
    
    console.log("🎉 Multiple products Redis test PASSED!");
  });

  test("Complex shopping cart scenario", async () => {
    console.log("\n🎯 Testing complex shopping cart scenario...");
    
    // Simulate a real e-commerce scenario
    const products = [
      { id: "laptop", stock: 5 },
      { id: "mouse", stock: 20 },
      { id: "keyboard", stock: 15 },
      { id: "monitor", stock: 3 }
    ];
    
    // Initialize products
    for (const product of products) {
      await MockRedisStockService.syncStockFromDB(product.id, product.stock);
    }
    
    // Shopping carts
    const carts = [
      { userId: "cart-user-1", items: [
        { productId: "laptop", quantity: 1 },
        { productId: "mouse", quantity: 2 },
        { productId: "keyboard", quantity: 1 }
      ]},
      { userId: "cart-user-2", items: [
        { productId: "laptop", quantity: 1 },
        { productId: "monitor", quantity: 2 }
      ]},
      { userId: "cart-user-3", items: [
        { productId: "mouse", quantity: 5 },
        { productId: "keyboard", quantity: 3 },
        { productId: "monitor", quantity: 1 }
      ]}
    ];
    
    // Process all carts concurrently
    const cartProcessing = carts.map(async (cart) => {
      const results = [];
      let allSuccess = true;
      
      for (const item of cart.items) {
        const result = await MockRedisStockService.reserveStockAtomic(
          item.productId,
          cart.userId,
          item.quantity
        );
        results.push({ ...item, success: result.success });
        if (!result.success) allSuccess = false;
      }
      
      return { 
        userId: cart.userId, 
        results, 
        cartComplete: allSuccess 
      };
    });
    
    const processedCarts = await Promise.allSettled(cartProcessing);
    
    console.log("🛒 Shopping cart results:");
    for (const result of processedCarts) {
      if (result.status === 'fulfilled') {
        const { userId, cartComplete, results } = result.value;
        const successItems = results.filter(r => r.success).length;
        console.log(`👤 ${userId}: ${cartComplete ? '✅ Complete' : '⚠️ Partial'} - ${successItems}/${results.length} items`);
      }
    }
    
    // Verify stock levels
    console.log("\n📦 Final inventory:");
    for (const product of products) {
      const finalStock = await MockRedisStockService.getCurrentStock(product.id);
      console.log(`  - ${product.id}: ${finalStock}/${product.stock} remaining`);
      expect(finalStock).toBeGreaterThanOrEqual(0);
    }
    
    console.log("🎉 Complex shopping cart scenario PASSED!");
  });
});