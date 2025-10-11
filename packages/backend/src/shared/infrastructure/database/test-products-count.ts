// test-products-count.ts
// Debug script to test product count
// Run: bun src/shared/infrastructure/database/test-products-count.ts

import { AdminGetProductsService } from "../../../domains/admin/application/use-cases/products/get-products.service";

async function main() {
  console.log("====================================");
  console.log("Product Count Debug");
  console.log("====================================\n");

  try {
    // Test default (limit=20)
    console.log("📦 Test 1: Default limit (should be 20)");
    const result1 = await AdminGetProductsService.execute({});
    console.log(`  - Returned items: ${result1.items.length}`);
    console.log(`  - Total: ${result1.total}`);
    console.log(`  - Limit: ${result1.limit}`);
    console.log(`  - Offset: ${result1.offset}\n`);

    // Test limit=50
    console.log("📦 Test 2: limit=50, offset=0");
    const result2 = await AdminGetProductsService.execute({
      limit: 50,
      offset: 0,
    });
    console.log(`  - Returned items: ${result2.items.length}`);
    console.log(`  - Total: ${result2.total}`);
    console.log(`  - Limit: ${result2.limit}`);
    console.log(`  - Offset: ${result2.offset}\n`);

    // Test limit=100
    console.log("📦 Test 3: limit=100, offset=0");
    const result3 = await AdminGetProductsService.execute({
      limit: 100,
      offset: 0,
    });
    console.log(`  - Returned items: ${result3.items.length}`);
    console.log(`  - Total: ${result3.total}`);
    console.log(`  - Limit: ${result3.limit}`);
    console.log(`  - Offset: ${result3.offset}\n`);

    console.log("====================================");
    console.log("First 5 product codes:");
    console.log("====================================");
    result3.items.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.productCode} - ${item.translations.tr.name || item.translations.en.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("🔥 Hata:", error);
    process.exit(1);
  }
}

main();
