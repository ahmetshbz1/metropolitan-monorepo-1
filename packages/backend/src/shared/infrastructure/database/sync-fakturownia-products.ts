// sync-fakturownia-products.ts
// Script to sync products from Fakturownia to database
// Run: bun run sync:fakturownia

import { FakturowniaSyncService } from "../external/fakturownia-sync.service";

async function main() {
  console.log("====================================");
  console.log("Fakturownia Product Sync");
  console.log("====================================\n");

  try {
    const result = await FakturowniaSyncService.syncProducts();

    console.log("\n====================================");
    console.log("✅ Sync tamamlandı!");
    console.log("====================================");
    console.log(
      `\n📊 Sonuçlar:\n` +
        `   - Toplam: ${result.total}\n` +
        `   - Eşleşen: ${result.matched}\n` +
        `   - Eşleşmeyen: ${result.notMatched}\n` +
        `   - Güncellenen: ${result.updated}\n` +
        `   - Hata: ${result.errors.length}`
    );

    if (result.notMatched > 0) {
      console.log(
        `\n⚠️  ${result.notMatched} ürün eşleşmedi. Bu ürünler Fakturownia'da var ama database'de yok olabilir.`
      );
    }

    if (result.errors.length > 0) {
      console.log("\n❌ Hatalar:");
      result.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.productCode}: ${err.error}`);
      });
    }

    process.exit(result.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n🔥 Kritik hata:", error);
    process.exit(1);
  }
}

main();
