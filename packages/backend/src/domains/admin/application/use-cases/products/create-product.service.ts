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
  serializeNullableJson,
  toDateOrNull,
  toDecimalString,
} from "./product.utils";
import { ProductTranslationService } from "../../../../../shared/infrastructure/ai/product-translation.service";

export class AdminCreateProductService {
  static async execute(payload: AdminProductPayload) {
    try {
      const turkishTranslation = payload.translations.find(t => t.languageCode === "tr");
      if (!turkishTranslation) {
        throw new Error("Türkçe çeviri zorunludur");
      }

      let finalTranslations;

      if (payload.translations.length === 3) {
        console.log("Using manual translations (skipping Gemini)...");
        finalTranslations = payload.translations.map(t => ({
          languageCode: t.languageCode as "tr" | "en" | "pl",
          name: t.name,
          fullName: t.fullName ?? null,
          description: t.description ?? null,
        }));
      } else {
        console.log("Generating translations with Gemini...");
        const generatedTranslations = await ProductTranslationService.generateTranslations({
          name: turkishTranslation.name,
          fullName: turkishTranslation.fullName,
          description: turkishTranslation.description,
          storageConditions: payload.storageConditions || undefined,
        });

        finalTranslations = [
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
      }

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
          finalTranslations.map((translation) => ({
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
