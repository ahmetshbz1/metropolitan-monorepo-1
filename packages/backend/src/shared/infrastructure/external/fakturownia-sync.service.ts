// fakturownia-sync.service.ts
// Service for syncing products between Fakturownia and database
// Matches products by code and updates IDs and tax rates

import { eq } from "drizzle-orm";

import { db } from "../database/connection";
import { products } from "../database/schema";
import { fakturowniaService } from "./fakturownia.service";
import { validateTaxRate } from "../../types/product.types";

interface SyncResult {
  total: number;
  matched: number;
  notMatched: number;
  updated: number;
  errors: Array<{ productCode: string; error: string }>;
}

export class FakturowniaSyncService {
  /**
   * Fakturownia'daki tüm ürünleri çek ve database ile eşleştir
   */
  static async syncProducts(): Promise<SyncResult> {
    const result: SyncResult = {
      total: 0,
      matched: 0,
      notMatched: 0,
      updated: 0,
      errors: [],
    };

    try {
      console.log("🔄 Fakturownia product sync başlatılıyor...");

      // 1. Fakturownia'dan tüm ürünleri çek
      const fakturowniaProducts = await fakturowniaService.listProducts();
      result.total = fakturowniaProducts.length;

      console.log(`📦 ${fakturowniaProducts.length} Fakturownia ürünü bulundu`);

      // 2. Her Fakturownia ürünü için database'de eşleşme ara
      for (const fakturowniaProduct of fakturowniaProducts) {
        try {
          // Code yoksa atla
          if (!fakturowniaProduct.code) {
            console.log(
              `⚠️ Fakturownia ürünü code'u yok (ID: ${fakturowniaProduct.id}, Name: ${fakturowniaProduct.name})`
            );
            result.notMatched++;
            continue;
          }

          // Database'de product_code ile ara
          const [dbProduct] = await db
            .select()
            .from(products)
            .where(eq(products.productCode, fakturowniaProduct.code))
            .limit(1);

          if (!dbProduct) {
            console.log(
              `⚠️ Database'de eşleşme bulunamadı (code: ${fakturowniaProduct.code})`
            );
            result.notMatched++;
            continue;
          }

          // 3. Eşleşen ürünü güncelle (tax, stock)
          // stock_level veya warehouse_quantity gerçek stok, quantity sadece satış birimi
          const stockQuantity = Math.round(
            fakturowniaProduct.stock_level ??
            fakturowniaProduct.warehouse_quantity ??
            fakturowniaProduct.quantity ??
            0
          );

          const taxValue = validateTaxRate(fakturowniaProduct.tax);

          await db
            .update(products)
            .set({
              fakturowniaProductId: fakturowniaProduct.id,
              tax: taxValue, // Integer tax value
              stock: stockQuantity,
              syncStatus: "synced",
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(products.id, dbProduct.id));

          console.log(
            `✅ Eşleşti ve güncellendi: ${fakturowniaProduct.code} → Fakturownia ID: ${fakturowniaProduct.id}, Tax: ${fakturowniaProduct.tax}%, Stock: ${stockQuantity}`
          );

          result.matched++;
          result.updated++;
        } catch (error) {
          console.error(
            `❌ Ürün sync hatası (code: ${fakturowniaProduct.code}):`,
            error
          );
          result.errors.push({
            productCode: fakturowniaProduct.code || "unknown",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      console.log("\n📊 Sync özeti:");
      console.log(`  Toplam Fakturownia ürünleri: ${result.total}`);
      console.log(`  Eşleşen: ${result.matched}`);
      console.log(`  Eşleşmeyen: ${result.notMatched}`);
      console.log(`  Güncellenen: ${result.updated}`);
      console.log(`  Hata sayısı: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log("\n❌ Hatalar:");
        result.errors.forEach((err) => {
          console.log(`  - ${err.productCode}: ${err.error}`);
        });
      }

      return result;
    } catch (error) {
      console.error("🔥 Fakturownia sync kritik hata:", error);
      throw new Error(
        `Fakturownia sync hatası: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Tek bir ürün için sync yap
   */
  static async syncSingleProduct(productCode: string): Promise<boolean> {
    try {
      console.log(`🔄 Tek ürün sync: ${productCode}`);

      // Fakturownia'da ara
      const fakturowniaProduct =
        await fakturowniaService.searchProductByCode(productCode);

      if (!fakturowniaProduct) {
        console.log(`⚠️ Fakturownia'da bulunamadı: ${productCode}`);
        return false;
      }

      // Database'de ara
      const [dbProduct] = await db
        .select()
        .from(products)
        .where(eq(products.productCode, productCode))
        .limit(1);

      if (!dbProduct) {
        console.log(`⚠️ Database'de bulunamadı: ${productCode}`);
        return false;
      }

      // Güncelle (tax, stock)
      // stock_level veya warehouse_quantity gerçek stok, quantity sadece satış birimi
      const stockQuantity = Math.round(
        fakturowniaProduct.stock_level ??
        fakturowniaProduct.warehouse_quantity ??
        fakturowniaProduct.quantity ??
        0
      );
      await db
        .update(products)
        .set({
          fakturowniaProductId: fakturowniaProduct.id,
          fakturowniaTax: fakturowniaProduct.tax.toString(),
          tax: fakturowniaProduct.tax.toString(), // Admin panel'de de doğru VAT görünsün
          stock: stockQuantity,
          updatedAt: new Date(),
        })
        .where(eq(products.id, dbProduct.id));

      console.log(
        `✅ Sync başarılı: ${productCode} → Fakturownia ID: ${fakturowniaProduct.id}, Tax: ${fakturowniaProduct.tax}%, Stock: ${stockQuantity}`
      );
      return true;
    } catch (error) {
      console.error(`❌ Tek ürün sync hatası (${productCode}):`, error);
      throw error;
    }
  }

  /**
   * Sync edilmemiş ürünleri listele
   */
  static async listUnsyncedProducts(): Promise<
    Array<{ id: string; productCode: string }>
  > {
    const unsyncedProducts = await db
      .select({
        id: products.id,
        productCode: products.productCode,
      })
      .from(products)
      .where(eq(products.fakturowniaProductId, null));

    console.log(`📋 ${unsyncedProducts.length} sync edilmemiş ürün var`);
    return unsyncedProducts;
  }
}
