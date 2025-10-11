// report-fakturownia-products.ts
// Script to generate sync report between Fakturownia and database
// Run: bun run report:fakturownia

import { db } from "../database/connection";
import { products } from "../database/schema";
import { fakturowniaService } from "../external/fakturownia.service";

async function main() {
  console.log("====================================");
  console.log("Fakturownia Product Sync Report");
  console.log("====================================\n");

  try {
    // 1. Fakturownia'dan tüm ürünleri çek
    console.log("📦 Fakturownia'dan ürünler çekiliyor...");
    const fakturowniaProducts = await fakturowniaService.listProducts();
    console.log(`✅ ${fakturowniaProducts.length} Fakturownia ürünü bulundu\n`);

    // 2. Database'den tüm ürünleri çek
    console.log("💾 Database'den ürünler çekiliyor...");
    const dbProducts = await db.select().from(products);
    console.log(`✅ ${dbProducts.length} database ürünü bulundu\n`);

    // 3. Fakturownia'da olup database'de olmayan ürünler
    console.log("==========================================");
    console.log("📋 Fakturownia'da VAR, Database'de YOK:");
    console.log("==========================================\n");

    const missingInDb: Array<{
      id: number;
      code: string | null;
      name: string;
      tax: number;
      price: number | null;
    }> = [];

    for (const fProduct of fakturowniaProducts) {
      if (!fProduct.code) {
        console.log(
          `⚠️  Code yok: ID=${fProduct.id}, Name="${fProduct.name}"`
        );
        missingInDb.push({
          id: fProduct.id,
          code: null,
          name: fProduct.name,
          tax: fProduct.tax,
          price: fProduct.price_gross || null,
        });
        continue;
      }

      const dbProduct = dbProducts.find(
        (p) => p.productCode === fProduct.code
      );

      if (!dbProduct) {
        console.log(
          `❌ Code=${fProduct.code}, Name="${fProduct.name}", Tax=${fProduct.tax}%, Price=${fProduct.price_gross || "N/A"}`
        );
        missingInDb.push({
          id: fProduct.id,
          code: fProduct.code,
          name: fProduct.name,
          tax: fProduct.tax,
          price: fProduct.price_gross || null,
        });
      }
    }

    console.log(`\n📊 Toplam: ${missingInDb.length} ürün\n`);

    // 4. Database'de olup Fakturownia'da olmayan ürünler
    console.log("==========================================");
    console.log("📋 Database'de VAR, Fakturownia'da YOK:");
    console.log("==========================================\n");

    const missingInFakturownia: Array<{
      code: string;
      name: string | null;
      tax: string | null;
    }> = [];

    for (const dbProduct of dbProducts) {
      const fProduct = fakturowniaProducts.find(
        (f) => f.code === dbProduct.productCode
      );

      if (!fProduct) {
        // Get product name from translations
        console.log(
          `❌ Code=${dbProduct.productCode}, Tax=${dbProduct.tax || "N/A"}%`
        );
        missingInFakturownia.push({
          code: dbProduct.productCode,
          name: null, // Could fetch from translations if needed
          tax: dbProduct.tax,
        });
      }
    }

    console.log(`\n📊 Toplam: ${missingInFakturownia.length} ürün\n`);

    // 5. Özet
    console.log("====================================");
    console.log("📊 ÖZET");
    console.log("====================================");
    console.log(`Fakturownia toplam: ${fakturowniaProducts.length}`);
    console.log(`Database toplam: ${dbProducts.length}`);
    console.log(`Eşleşen: ${fakturowniaProducts.length - missingInDb.length}`);
    console.log(
      `Fakturownia'da var, Database'de yok: ${missingInDb.length}`
    );
    console.log(
      `Database'de var, Fakturownia'da yok: ${missingInFakturownia.length}`
    );

    // 6. Detaylı liste
    if (missingInDb.length > 0) {
      console.log("\n\n====================================");
      console.log("📝 DETAYLI LİSTE: Fakturownia'da var, Database'de yok");
      console.log("====================================\n");

      const withCode = missingInDb.filter((p) => p.code);
      const withoutCode = missingInDb.filter((p) => !p.code);

      if (withCode.length > 0) {
        console.log("✅ Code olan ürünler (import edilebilir):\n");
        withCode.forEach((p, index) => {
          console.log(
            `${index + 1}. Code: ${p.code}, Name: "${p.name}", Tax: ${p.tax}%, Price: ${p.price || "N/A"}`
          );
        });
      }

      if (withoutCode.length > 0) {
        console.log(
          `\n⚠️  Code olmayan ürünler (manuel düzenleme gerekli):\n`
        );
        withoutCode.forEach((p, index) => {
          console.log(
            `${index + 1}. ID: ${p.id}, Name: "${p.name}", Tax: ${p.tax}%`
          );
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("\n🔥 Hata:", error);
    process.exit(1);
  }
}

main();
