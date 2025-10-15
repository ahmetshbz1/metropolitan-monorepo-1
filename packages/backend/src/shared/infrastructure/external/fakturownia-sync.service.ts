// fakturownia-sync.service.ts
// Service for syncing products between Fakturownia and database
// Matches products by code and updates IDs and tax rates

import { eq, isNull } from "drizzle-orm";

import { validateTaxRate } from "../../types/product.types";
import { db } from "../database/connection";
import { products } from "../database/schema";
import { logger } from "../monitoring/logger.config";

import { fakturowniaService } from "./fakturownia.service";

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
      logger.info("Fakturownia product sync başlatılıyor");

      // 1. Fakturownia'dan tüm ürünleri çek
      const fakturowniaProducts = await fakturowniaService.listProducts();
      result.total = fakturowniaProducts.length;

      logger.info(
        { count: fakturowniaProducts.length },
        "Fakturownia ürünü bulundu"
      );

      // 2. Her Fakturownia ürünü için database'de eşleşme ara
      for (const fakturowniaProduct of fakturowniaProducts) {
        try {
          // Code yoksa atla
          if (!fakturowniaProduct.code) {
            logger.warn(
              {
                productId: fakturowniaProduct.id,
                name: fakturowniaProduct.name,
              },
              "Fakturownia ürünü code'u yok"
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
            logger.warn(
              { code: fakturowniaProduct.code },
              "Database'de eşleşme bulunamadı"
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

          logger.info(
            {
              code: fakturowniaProduct.code,
              fakturowniaId: fakturowniaProduct.id,
              tax: fakturowniaProduct.tax,
              stock: stockQuantity,
            },
            "Eşleşti ve güncellendi"
          );

          result.matched++;
          result.updated++;
        } catch (error) {
          logger.error(
            {
              code: fakturowniaProduct.code,
              error: error instanceof Error ? error.message : String(error),
            },
            "Ürün sync hatası"
          );
          result.errors.push({
            productCode: fakturowniaProduct.code || "unknown",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info(
        {
          total: result.total,
          matched: result.matched,
          notMatched: result.notMatched,
          updated: result.updated,
          errorCount: result.errors.length,
        },
        "Sync özeti"
      );

      if (result.errors.length > 0) {
        logger.error({ errors: result.errors }, "Sync hataları");
      }

      return result;
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Fakturownia sync kritik hata"
      );
      throw new Error(
        `Fakturownia sync hatası: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Tek bir ürün için sync yap
   */
  static async syncSingleProduct(productCode: string): Promise<boolean> {
    try {
      logger.info({ productCode }, "Tek ürün sync");

      // Fakturownia'da ara
      const fakturowniaProduct = await fakturowniaService.searchProductByCode(
        productCode
      );

      if (!fakturowniaProduct) {
        logger.warn({ productCode }, "Fakturownia'da bulunamadı");
        return false;
      }

      // Database'de ara
      const [dbProduct] = await db
        .select()
        .from(products)
        .where(eq(products.productCode, productCode))
        .limit(1);

      if (!dbProduct) {
        logger.warn({ productCode }, "Database'de bulunamadı");
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

      logger.info(
        {
          productCode,
          fakturowniaId: fakturowniaProduct.id,
          tax: fakturowniaProduct.tax,
          stock: stockQuantity,
        },
        "Sync başarılı"
      );
      return true;
    } catch (error) {
      logger.error(
        {
          productCode,
          error: error instanceof Error ? error.message : String(error),
        },
        "Tek ürün sync hatası"
      );
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
      .where(isNull(products.fakturowniaProductId));

    logger.info(
      { count: unsyncedProducts.length },
      "Sync edilmemiş ürün listesi"
    );
    return unsyncedProducts;
  }
}
