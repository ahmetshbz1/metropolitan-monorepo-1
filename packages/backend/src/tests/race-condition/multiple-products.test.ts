// "multiple-products.test.ts"
// Multiple products race condition tests

import { beforeAll, describe, expect, test } from "bun:test";
import { OrderCreationService } from "../../domains/order/application/use-cases/order-creation.service";
import {
  TEST_USERS,
  TEST_ORDER_REQUEST,
  cleanupTestData,
  setupTestUsers,
  setupTestProduct,
  addToCart,
  getCartItems
} from './test-helpers';

describe("🎪 Multiple Products Race Condition Tests", () => {
  
  beforeAll(async () => {
    console.log("🔧 Setting up multiple products test...");
    
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test users
    await setupTestUsers();
    
    console.log("✅ Test setup complete!");
  });

  test("Multiple products race condition test", async () => {
    console.log("\n🎯 Testing multiple products race condition...");
    
    const MULTI_PRODUCTS = [
      { id: "multi-test-1", name: "Multi Test 1", stock: 2, price: 50.0 },
      { id: "multi-test-2", name: "Multi Test 2", stock: 1, price: 75.0 }
    ];
    
    // Setup multiple test products
    for (const product of MULTI_PRODUCTS) {
      await setupTestProduct(product);
    }
    
    // User 1: 2x Product 1, 1x Product 2
    await addToCart(TEST_USERS[0].id, MULTI_PRODUCTS[0].id, 2);
    await addToCart(TEST_USERS[0].id, MULTI_PRODUCTS[1].id, 1);
    
    // User 2: 1x Product 1, 1x Product 2  
    await addToCart(TEST_USERS[1].id, MULTI_PRODUCTS[0].id, 1);
    await addToCart(TEST_USERS[1].id, MULTI_PRODUCTS[1].id, 1);
    
    const cartItems1 = await getCartItems(TEST_USERS[0].id);
    const cartItems2 = await getCartItems(TEST_USERS[1].id);
    
    // Create order items
    const orderItems1 = cartItems1.map(item => {
      const product = MULTI_PRODUCTS.find(p => p.id === item.productId)!;
      return {
        product: { id: item.productId, name: product.name, price: product.price },
        quantity: item.quantity,
        unitPrice: product.price.toString(),
        totalPrice: (product.price * item.quantity).toString()
      };
    });
    
    const orderItems2 = cartItems2.map(item => {
      const product = MULTI_PRODUCTS.find(p => p.id === item.productId)!;
      return {
        product: { id: item.productId, name: product.name, price: product.price },
        quantity: item.quantity,
        unitPrice: product.price.toString(),
        totalPrice: (product.price * item.quantity).toString()
      };
    });

    // Concurrent orders
    const [result1, result2] = await Promise.allSettled([
      OrderCreationService.createOrderWithStripe(
        TEST_USERS[0].id,
        TEST_ORDER_REQUEST,
        orderItems1,
        cartItems1,
        125.0 // 2*50 + 1*75
      ),
      OrderCreationService.createOrderWithStripe(
        TEST_USERS[1].id,
        TEST_ORDER_REQUEST,
        orderItems2,
        cartItems2,
        125.0 // 1*50 + 1*75
      )
    ]);

    console.log("📊 Multiple products race test results:");
    
    // One should succeed (user 1 gets everything)
    // One should fail (user 2 can't get Product 2 because user 1 took it)
    expect([result1, result2].filter(r => r.status === 'fulfilled').length).toBe(1);
    expect([result1, result2].filter(r => r.status === 'rejected').length).toBe(1);
    
    console.log("🎉 Multiple products race condition test PASSED!");
  });

  test("Complex cart scenario with partial fulfillment", async () => {
    console.log("\n🎯 Testing complex cart scenario...");
    
    const COMPLEX_PRODUCTS = [
      { id: "complex-test-1", name: "Complex Test 1", stock: 10, price: 25.0 },
      { id: "complex-test-2", name: "Complex Test 2", stock: 5, price: 35.0 },
      { id: "complex-test-3", name: "Complex Test 3", stock: 3, price: 45.0 }
    ];
    
    // Setup products
    for (const product of COMPLEX_PRODUCTS) {
      await setupTestProduct(product);
    }
    
    // Three users with overlapping cart items
    const userCarts = [
      { userId: TEST_USERS[0].id, items: [
        { productId: COMPLEX_PRODUCTS[0].id, quantity: 5 },
        { productId: COMPLEX_PRODUCTS[1].id, quantity: 3 }
      ]},
      { userId: TEST_USERS[1].id, items: [
        { productId: COMPLEX_PRODUCTS[0].id, quantity: 6 },
        { productId: COMPLEX_PRODUCTS[2].id, quantity: 2 }
      ]}
    ];
    
    // Add items to carts
    for (const { userId, items } of userCarts) {
      for (const { productId, quantity } of items) {
        await addToCart(userId, productId, quantity);
      }
    }
    
    // Prepare order data
    const orderDataPromises = userCarts.map(async ({ userId }) => {
      const cartItems = await getCartItems(userId);
      const orderItems = cartItems.map(item => {
        const product = COMPLEX_PRODUCTS.find(p => p.id === item.productId)!;
        return {
          product: { id: item.productId, name: product.name, price: product.price },
          quantity: item.quantity,
          unitPrice: product.price.toString(),
          totalPrice: (product.price * item.quantity).toString()
        };
      });
      
      const totalPrice = orderItems.reduce((sum, item) => 
        sum + (parseFloat(item.unitPrice) * item.quantity), 0
      );
      
      return { userId, orderItems, cartItems, totalPrice };
    });
    
    const orderData = await Promise.all(orderDataPromises);
    
    // Create concurrent orders
    const orderPromises = orderData.map(({ userId, orderItems, cartItems, totalPrice }) =>
      OrderCreationService.createOrderWithStripe(
        userId,
        TEST_ORDER_REQUEST,
        orderItems,
        cartItems,
        totalPrice
      )
    );
    
    const results = await Promise.allSettled(orderPromises);
    
    console.log("📊 Complex cart scenario results:");
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Successful orders: ${successCount}`);
    console.log(`❌ Failed orders: ${failureCount}`);
    
    // At least one order should succeed
    expect(successCount).toBeGreaterThanOrEqual(1);
    
    console.log("🎉 Complex cart scenario test PASSED!");
  });
});