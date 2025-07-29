// "basic-race-condition.test.ts"
// Basic stock race condition tests

import { beforeAll, describe, expect, test } from "bun:test";
import { OrderCreationService } from "../../domains/order/application/use-cases/order-creation.service";
import {
  TEST_USERS,
  TEST_PRODUCT,
  TEST_ORDER_REQUEST,
  cleanupTestData,
  setupTestUsers,
  setupTestProduct,
  addToCart,
  getCartItems,
  getCurrentStock
} from './test-helpers';

describe("🏁 Basic Stock Race Condition Tests", () => {
  
  beforeAll(async () => {
    console.log("🔧 Setting up race condition test...");
    
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test users
    await setupTestUsers();
    
    // Create test product with stock = 1
    await setupTestProduct();
    
    console.log("✅ Test setup complete!");
  });

  test("Two users ordering same product simultaneously - Should prevent over-selling", async () => {
    console.log("\n🎯 Starting race condition test...");
    
    // Add product to both users' carts
    await addToCart(TEST_USERS[0].id, TEST_PRODUCT.id, 1);
    await addToCart(TEST_USERS[1].id, TEST_PRODUCT.id, 1);
    
    console.log("🛒 Both users have product in cart");
    
    // Prepare order data for both users
    const cartItems1 = await getCartItems(TEST_USERS[0].id);
    const cartItems2 = await getCartItems(TEST_USERS[1].id);
    
    const orderItems1 = cartItems1.map(item => ({
      product: { id: item.productId, name: TEST_PRODUCT.name, price: TEST_PRODUCT.price },
      quantity: item.quantity,
      unitPrice: TEST_PRODUCT.price.toString(),
      totalPrice: (TEST_PRODUCT.price * item.quantity).toString()
    }));
    
    const orderItems2 = cartItems2.map(item => ({
      product: { id: item.productId, name: TEST_PRODUCT.name, price: TEST_PRODUCT.price },
      quantity: item.quantity,
      unitPrice: TEST_PRODUCT.price.toString(),
      totalPrice: (TEST_PRODUCT.price * item.quantity).toString()
    }));

    console.log("⏰ Simulating concurrent order creation...");
    
    // 🚀 THE CRITICAL TEST: Simultaneous order creation
    const [result1, result2] = await Promise.allSettled([
      OrderCreationService.createOrderWithStripe(
        TEST_USERS[0].id,
        TEST_ORDER_REQUEST,
        orderItems1,
        cartItems1,
        TEST_PRODUCT.price
      ),
      OrderCreationService.createOrderWithStripe(
        TEST_USERS[1].id,
        TEST_ORDER_REQUEST,
        orderItems2,
        cartItems2,
        TEST_PRODUCT.price
      )
    ]);

    console.log("📊 Race condition test results:");
    
    // Analyze results
    const successCount = [result1, result2].filter(r => r.status === 'fulfilled').length;
    const failureCount = [result1, result2].filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Successful orders: ${successCount}`);
    console.log(`❌ Failed orders: ${failureCount}`);
    
    if (result1.status === 'fulfilled') {
      console.log(`🏆 User 1 order successful: ${result1.value.order.orderNumber}`);
    } else {
      console.log(`💥 User 1 order failed: ${result1.reason.message}`);
    }
    
    if (result2.status === 'fulfilled') {
      console.log(`🏆 User 2 order successful: ${result2.value.order.orderNumber}`);
    } else {
      console.log(`💥 User 2 order failed: ${result2.reason.message}`);
    }

    // Verify stock after race condition
    const finalStock = await getCurrentStock(TEST_PRODUCT.id);
    console.log(`📦 Final stock: ${finalStock}`);
    
    // 🧪 ASSERTIONS
    expect(successCount).toBe(1); // Only one order should succeed
    expect(failureCount).toBe(1); // One order should fail
    expect(finalStock).toBe(0); // Stock should be 0 (1 - 1 = 0)
    
    // Verify error message contains "Insufficient stock"
    const failedResult = [result1, result2].find(r => r.status === 'rejected');
    expect(failedResult?.status).toBe('rejected');
    if (failedResult?.status === 'rejected') {
      expect(failedResult.reason.message).toContain('Insufficient stock');
    }
    
    console.log("🎉 Race condition test PASSED! No over-selling occurred!");
  });
});