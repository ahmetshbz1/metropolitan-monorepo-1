//  "update-product.service.ts"
//  metropolitan backend
//  Admin ürün güncelleme servisi

import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  productTranslations,
  products,
} from "../../../../../shared/infrastructure/database/schema";
import type { AdminUpdateProductPayload } from "./product.types";
import {
  ensureLanguageCoverage,
  serializeNullableJson,
  toDateOrNull,
  toDecimalString,
} from "./product.utils";

export class AdminUpdateProductService {
  static async execute(payload: AdminUpdateProductPayload) {
    ensureLanguageCoverage(payload.translations);

    try {
      const existingProductResult = await db
        .select()
        .from(products)
        .where(eq(products.id, payload.productId))
        .limit(1);

      if (existingProductResult.length === 0) {
        throw new Error("Ürün bulunamadı");
      }

      const existingProduct = existingProductResult[0];

      if (payload.productCode !== existingProduct.productCode) {
        const anotherProduct = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.productCode, payload.productCode))
          .limit(1);

        if (
          anotherProduct.length > 0 &&
          anotherProduct[0].id !== payload.productId
        ) {
          throw new Error("Bu ürün kodu başka bir ürün tarafından kullanılıyor");
        }
      }

      await db.transaction(async (tx) => {
        await tx
          .update(products)
          .set({
            productCode: payload.productCode,
            categoryId: payload.categoryId ?? null,
            brand: payload.brand ?? null,
            size: payload.size ?? null,
            imageUrl: payload.imageUrl ?? null,
            price: toDecimalString(payload.price),
            currency: payload.currency ?? "PLN",
            stock: payload.stock ?? 0,
            allergens: serializeNullableJson(payload.allergens),
            nutritionalValues: serializeNullableJson(payload.nutritionalValues),
            netQuantity: payload.netQuantity ?? null,
            expiryDate: toDateOrNull(payload.expiryDate),
            storageConditions: payload.storageConditions ?? null,
            manufacturerInfo: serializeNullableJson(payload.manufacturerInfo),
            originCountry: payload.originCountry ?? null,
            badges: serializeNullableJson(payload.badges),
            individualPrice: toDecimalString(payload.individualPrice),
            corporatePrice: toDecimalString(payload.corporatePrice),
            minQuantityIndividual: payload.minQuantityIndividual ?? 1,
            minQuantityCorporate: payload.minQuantityCorporate ?? 1,
            quantityPerBox: payload.quantityPerBox ?? null,
            updatedAt: new Date(),
          })
          .where(eq(products.id, payload.productId));

        await tx
          .delete(productTranslations)
          .where(eq(productTranslations.productId, payload.productId));

        await tx.insert(productTranslations).values(
          payload.translations.map((translation) => ({
            productId: payload.productId,
            languageCode: translation.languageCode,
            name: translation.name,
            fullName: translation.fullName ?? null,
            description: translation.description ?? null,
          }))
        );
      });

      return {
        success: true,
        productId: payload.productId,
        message: "Ürün güncellendi",
      };
    } catch (error) {
      console.error("Admin ürün güncelleme hatası", error);
      throw new Error(
        error instanceof Error ? error.message : "Ürün güncellenemedi"
      );
    }
  }
}
