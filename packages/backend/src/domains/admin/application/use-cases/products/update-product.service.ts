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
  serializeNullableJson,
  toDateOrNull,
  toDecimalString,
} from "./product.utils";
import { ProductTranslationService } from "../../../../../shared/infrastructure/ai/product-translation.service";

export class AdminUpdateProductService {
  static async execute(payload: AdminUpdateProductPayload) {
    try {
      const turkishTranslation = payload.translations.find(t => t.languageCode === "tr");
      if (!turkishTranslation) {
        throw new Error("Türkçe çeviri zorunludur");
      }

      console.log("Generating translations with Gemini...");
      const generatedTranslations = await ProductTranslationService.generateTranslations({
        name: turkishTranslation.name,
        fullName: turkishTranslation.fullName,
        description: turkishTranslation.description,
        storageConditions: payload.storageConditions || undefined,
      });

      const finalTranslations = [
        {
          languageCode: "tr" as const,
          name: generatedTranslations.tr.name,
          fullName: generatedTranslations.tr.fullName,
          description: generatedTranslations.tr.description,
        },
        {
          languageCode: "en" as const,
          name: generatedTranslations.en.name,
          fullName: generatedTranslations.en.fullName,
          description: generatedTranslations.en.description,
        },
        {
          languageCode: "pl" as const,
          name: generatedTranslations.pl.name,
          fullName: generatedTranslations.pl.fullName,
          description: generatedTranslations.pl.description,
        },
      ];

      console.log("Translations generated successfully");

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
          finalTranslations.map((translation) => ({
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
