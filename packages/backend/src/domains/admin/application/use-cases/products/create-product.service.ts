//  "create-product.service.ts"
//  metropolitan backend
//  Admin ürün oluşturma servisi

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  productTranslations,
  products,
} from "../../../../../shared/infrastructure/database/schema";
import type { AdminProductPayload } from "./product.types";
import {
  ensureLanguageCoverage,
  serializeNullableJson,
  toDateOrNull,
  toDecimalString,
} from "./product.utils";

export class AdminCreateProductService {
  static async execute(payload: AdminProductPayload) {
    ensureLanguageCoverage(payload.translations);

    try {
      const result = await db.transaction(async (tx) => {
        const [createdProduct] = await tx
          .insert(products)
          .values({
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
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning({ id: products.id });

        await tx.insert(productTranslations).values(
          payload.translations.map((translation) => ({
            productId: createdProduct.id,
            languageCode: translation.languageCode,
            name: translation.name,
            fullName: translation.fullName ?? null,
            description: translation.description ?? null,
          }))
        );

        return createdProduct.id;
      });

      return {
        success: true,
        productId: result,
        message: "Ürün başarıyla oluşturuldu",
      };
    } catch (error) {
      console.error("Admin ürün oluşturma hatası", error);
      throw new Error(
        error instanceof Error ? error.message : "Ürün oluşturulamadı"
      );
    }
  }
}
