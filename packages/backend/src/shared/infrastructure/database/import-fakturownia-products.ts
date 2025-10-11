// import-fakturownia-products.ts
// Script to import products from Fakturownia that don't exist in database
// Run: bun run import:fakturownia

import { db } from "../database/connection";
import { productTranslations, products } from "../database/schema";
import { fakturowniaService } from "../external/fakturownia.service";

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{ code: string; error: string }>;
}

async function main() {
  console.log("====================================");
  console.log("Fakturownia Product Import");
  console.log("====================================\n");

  const result: ImportResult = {
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // 1. Fakturownia'dan tüm ürünleri çek
    console.log("📦 Fakturownia'dan ürünler çekiliyor...");
    const fakturowniaProducts = await fakturowniaService.listProducts();
    console.log(`✅ ${fakturowniaProducts.length} Fakturownia ürünü bulundu\n`);

    // 2. Database'den tüm ürünleri çek
    console.log("💾 Database'den ürünler çekiliyor...");
    const dbProducts = await db.select().from(products);
    console.log(`✅ ${dbProducts.length} database ürünü bulundu\n`);

    // 3. Code'lu ve database'de olmayan ürünleri import et
    console.log("==========================================");
    console.log("🔄 Import işlemi başlatılıyor...");
    console.log("==========================================\n");

    for (const fProduct of fakturowniaProducts) {
      // Code yoksa atla
      if (!fProduct.code) {
        console.log(
          `⚠️  Code yok (ID: ${fProduct.id}, Name: "${fProduct.name}") - atlanıyor`
        );
        result.skipped++;
        continue;
      }

      result.total++;

      // Database'de var mı kontrol et
      const dbProduct = dbProducts.find((p) => p.productCode === fProduct.code);

      if (dbProduct) {
        console.log(`⏭️  Zaten var: ${fProduct.code} - atlanıyor`);
        result.skipped++;
        continue;
      }

      // Import et
      try {
        // stock_level veya warehouse_quantity gerçek stok, quantity sadece satış birimi
        const stockQuantity = Math.round(
          fProduct.stock_level ??
          fProduct.warehouse_quantity ??
          fProduct.quantity ??
          0
        );
        console.log(
          `🔄 Import ediliyor: Code=${fProduct.code}, Name="${fProduct.name}", Tax=${fProduct.tax}%, Price=${fProduct.price_gross || "N/A"}, Stock=${stockQuantity}`
        );

        // Ürünü ekle
        const [newProduct] = await db
          .insert(products)
          .values({
            productCode: fProduct.code,
            categoryId: null,
            brand: "Yayla",
            size: null,
            imageUrl: null,
            price: fProduct.price_gross?.toString() || "0",
            currency: "PLN",
            stock: stockQuantity,
            individualPrice: fProduct.price_gross?.toString() || "0",
            corporatePrice: fProduct.price_gross
              ? (fProduct.price_gross * 0.85).toFixed(2)
              : "0",
            minQuantityIndividual: 1,
            minQuantityCorporate: 6,
            quantityPerBox: 6,
            tax: fProduct.tax.toString(),
            fakturowniaProductId: fProduct.id,
            fakturowniaTax: fProduct.tax.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning({ id: products.id });

        if (!newProduct) {
          throw new Error(`Failed to insert product: ${fProduct.code}`);
        }

        // TR, EN, PL dilleri için translations ekle
        const languageCodes = ["tr", "en", "pl"];
        for (const lang of languageCodes) {
          await db.insert(productTranslations).values({
            productId: newProduct.id,
            languageCode: lang,
            name: fProduct.name,
            fullName: fProduct.name,
            description: null,
          });
        }

        console.log(`✅ Import edildi: ${fProduct.code}`);
        result.imported++;
      } catch (error) {
        console.error(`❌ Import hatası (${fProduct.code}):`, error);
        result.errors.push({
          code: fProduct.code,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 4. Özet
    console.log("\n====================================");
    console.log("📊 ÖZET");
    console.log("====================================");
    console.log(`Toplam işlenen: ${result.total}`);
    console.log(`Import edilen: ${result.imported}`);
    console.log(`Atlanan: ${result.skipped}`);
    console.log(`Hata sayısı: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\n❌ Hatalar:");
      result.errors.forEach((err) => {
        console.log(`  - ${err.code}: ${err.error}`);
      });
    }

    if (result.imported > 0) {
      console.log("\n💡 NOT:");
      console.log("  - Stok miktarları Fakturownia'dan sync edildi");
      console.log("  - Kategori bilgisi yok (admin panelden ayarlanabilir)");
      console.log("  - Görseller eklenmedi (admin panelden yüklenebilir)");
      console.log("  - Tüm dillerde aynı isim kullanıldı (admin düzenleyebilir)");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n🔥 Kritik hata:", error);
    process.exit(1);
  }
}

main();
