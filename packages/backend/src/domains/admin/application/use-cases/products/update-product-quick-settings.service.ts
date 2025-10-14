import { eq } from "drizzle-orm";

import { RedisStockService } from "../../../../../shared/infrastructure/cache/redis-stock.service";
import { db } from "../../../../../shared/infrastructure/database/connection";
import { products } from "../../../../../shared/infrastructure/database/schema";

import { toDecimalString } from "./product.utils";

interface AdminQuickUpdateInput {
  productId: string;
  stock?: number;
  individualPrice?: number | null;
  corporatePrice?: number | null;
  minQuantityIndividual?: number;
  minQuantityCorporate?: number;
  quantityPerBox?: number | null;
  adminUserId: string;
}

export class AdminUpdateProductQuickSettingsService {
  static async execute({
    productId,
    stock,
    individualPrice,
    corporatePrice,
    minQuantityIndividual,
    minQuantityCorporate,
    quantityPerBox,
    adminUserId,
  }: AdminQuickUpdateInput) {
    const updates: Record<string, unknown> = {};

    if (stock !== undefined) {
      if (!Number.isFinite(stock) || stock < 0) {
        throw new Error("Geçersiz stok değeri");
      }
      updates.stock = Math.floor(stock);
    }

    if (individualPrice !== undefined) {
      if (individualPrice === null) {
        updates.individualPrice = null;
      } else if (Number.isFinite(individualPrice) && individualPrice >= 0) {
        updates.individualPrice = toDecimalString(individualPrice);
      } else {
        throw new Error("Geçersiz bireysel fiyat");
      }
    }

    if (corporatePrice !== undefined) {
      if (corporatePrice === null) {
        updates.corporatePrice = null;
      } else if (Number.isFinite(corporatePrice) && corporatePrice >= 0) {
        updates.corporatePrice = toDecimalString(corporatePrice);
      } else {
        throw new Error("Geçersiz kurumsal fiyat");
      }
    }

    if (minQuantityIndividual !== undefined) {
      if (
        !Number.isFinite(minQuantityIndividual) ||
        minQuantityIndividual < 0
      ) {
        throw new Error("Geçersiz bireysel minimum adet değeri");
      }
      updates.minQuantityIndividual = Math.floor(minQuantityIndividual);
    }

    if (minQuantityCorporate !== undefined) {
      if (!Number.isFinite(minQuantityCorporate) || minQuantityCorporate < 0) {
        throw new Error("Geçersiz kurumsal minimum adet değeri");
      }
      updates.minQuantityCorporate = Math.floor(minQuantityCorporate);
    }

    if (quantityPerBox !== undefined) {
      if (quantityPerBox === null) {
        updates.quantityPerBox = null;
      } else if (Number.isFinite(quantityPerBox) && quantityPerBox >= 0) {
        updates.quantityPerBox = Math.floor(quantityPerBox);
      } else {
        throw new Error("Geçersiz koli adedi");
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("Güncellenecek bir alan belirtmelisiniz");
    }

    updates.updatedAt = new Date();

    const [result] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, productId))
      .returning({
        id: products.id,
        stock: products.stock,
        individualPrice: products.individualPrice,
        corporatePrice: products.corporatePrice,
        minQuantityIndividual: products.minQuantityIndividual,
        minQuantityCorporate: products.minQuantityCorporate,
        quantityPerBox: products.quantityPerBox,
      });

    if (!result) {
      throw new Error("Ürün bulunamadı");
    }

    // Stok güncelleniyorsa Redis'i distributed lock ile senkronize et
    if (stock !== undefined && result.stock !== null) {
      try {
        const redisResult = await RedisStockService.setStockLevelWithLock(
          productId,
          result.stock,
          adminUserId
        );

        if (redisResult.success) {
          console.log(
            `✅ Redis stok güncellendi: ${productId} -> ${result.stock}`
          );
        } else {
          console.warn(`⚠️ Redis lock alınamadı (${productId}): ${redisResult.error}`);
        }
      } catch (error) {
        console.warn(`⚠️ Redis stok güncellenemedi (${productId}):`, error);
        // Redis hatası database işlemini etkilememeli
      }
    }

    return {
      success: true,
      productId: result.id,
      stock: result.stock,
      individualPrice: result.individualPrice,
      corporatePrice: result.corporatePrice,
      minQuantityIndividual: result.minQuantityIndividual,
      minQuantityCorporate: result.minQuantityCorporate,
      quantityPerBox: result.quantityPerBox,
    };
  }
}
