//  "update-product.service.ts"
//  metropolitan backend
//  Admin ürün güncelleme servisi

import { eq } from "drizzle-orm";

import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";
import { ProductTranslationService } from "../../../../../shared/infrastructure/ai/product-translation.service";
import { RedisStockService } from "../../../../../shared/infrastructure/cache/redis-stock.service";
import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  productTranslations,
  products,
} from "../../../../../shared/infrastructure/database/schema";
import { fakturowniaService } from "../../../../../shared/infrastructure/external/fakturownia.service";
import { validateTaxRate } from "../../../../../shared/types/product.types";

import { ProductImageService } from "./product-image.service";
import type {
  AdminUpdateProductPayload,
  SupportedLanguage,
} from "./product.types";
import { SUPPORTED_LANGUAGES } from "./product.types";
import {
  serializeNullableJson,
  toDateOrNull,
  toDecimalString,
} from "./product.utils";

export class AdminUpdateProductService {
  static async execute(payload: AdminUpdateProductPayload) {
    try {
      const turkishTranslation = payload.translations.find(
        (t) => t.languageCode === "tr"
      );
      if (!turkishTranslation) {
        throw new Error("Türkçe çeviri zorunludur");
      }

      const normalize = (value?: string | null) => (value ?? "").trim();

      const manualTranslationsProvided =
        payload.translations.length === SUPPORTED_LANGUAGES.length;

      const existingProductResult = await db
        .select()
        .from(products)
        .where(eq(products.id, payload.productId))
        .limit(1);

      if (existingProductResult.length === 0) {
        throw new Error("Ürün bulunamadı");
      }

      const existingProduct = existingProductResult[0];

      if (
        existingProduct.imageUrl &&
        existingProduct.imageUrl !== payload.imageUrl
      ) {
        await ProductImageService.deleteProductImage(existingProduct.imageUrl);
      }

      const existingTranslations = await db
        .select()
        .from(productTranslations)
        .where(eq(productTranslations.productId, payload.productId));

      const existingTranslationsMap: Partial<
        Record<SupportedLanguage, (typeof existingTranslations)[number]>
      > = {};
      for (const translation of existingTranslations) {
        existingTranslationsMap[translation.languageCode as SupportedLanguage] =
          translation;
      }

      let finalTranslations: Array<{
        languageCode: SupportedLanguage;
        name: string;
        fullName: string | null;
        description: string | null;
      }> = [];

      if (manualTranslationsProvided) {
        logger.info({ context: "AdminUpdateProductService" }, "Using manual translations (skipping Gemini)");
        finalTranslations = SUPPORTED_LANGUAGES.map((languageCode) => {
          const translation = payload.translations.find(
            (item) => item.languageCode === languageCode
          );
          if (!translation) {
            throw new Error(`${languageCode} çevirisi manuel modda zorunludur`);
          }
          return {
            languageCode,
            name: translation.name,
            fullName: translation.fullName ?? null,
            description: translation.description ?? null,
          };
        });
      } else {
        const existingTurkish = existingTranslationsMap.tr;
        const baseTranslationChanged =
          normalize(turkishTranslation.name) !==
            normalize(existingTurkish?.name) ||
          normalize(turkishTranslation.fullName ?? null) !==
            normalize(existingTurkish?.fullName) ||
          normalize(turkishTranslation.description ?? null) !==
            normalize(existingTurkish?.description);

        const storageConditionsChanged =
          normalize(payload.storageConditions ?? null) !==
          normalize(existingProduct.storageConditions);

        const missingLanguages = SUPPORTED_LANGUAGES.filter(
          (language) => language !== "tr" && !existingTranslationsMap[language]
        );

        const shouldRegenerateTranslations =
          baseTranslationChanged ||
          storageConditionsChanged ||
          missingLanguages.length > 0;

        if (shouldRegenerateTranslations) {
          logger.info({ context: "AdminUpdateProductService" }, "Generating translations with Gemini");
          const generatedTranslations =
            await ProductTranslationService.generateTranslations({
              name: turkishTranslation.name,
              fullName: turkishTranslation.fullName,
              description: turkishTranslation.description,
              storageConditions: payload.storageConditions || undefined,
            });

          finalTranslations = [
            {
              languageCode: "tr",
              name: generatedTranslations.tr.name,
              fullName: generatedTranslations.tr.fullName,
              description: generatedTranslations.tr.description,
            },
            {
              languageCode: "en",
              name: generatedTranslations.en.name,
              fullName: generatedTranslations.en.fullName,
              description: generatedTranslations.en.description,
            },
            {
              languageCode: "pl",
              name: generatedTranslations.pl.name,
              fullName: generatedTranslations.pl.fullName,
              description: generatedTranslations.pl.description,
            },
          ];
          logger.info({ context: "AdminUpdateProductService" }, "Translations generated successfully");
        } else {
          logger.info({ context: "AdminUpdateProductService" }, "Reusing existing translations (no changes detected)");
          finalTranslations = SUPPORTED_LANGUAGES.map((languageCode) => {
            if (languageCode === "tr") {
              return {
                languageCode,
                name: turkishTranslation.name,
                fullName: turkishTranslation.fullName ?? null,
                description: turkishTranslation.description ?? null,
              };
            }

            const existingTranslation = existingTranslationsMap[languageCode];
            if (!existingTranslation) {
              throw new Error(
                `${languageCode} çevirisi bulunamadı; yeniden oluşturma gerekiyor`
              );
            }

            return {
              languageCode,
              name: existingTranslation.name,
              fullName: existingTranslation.fullName ?? null,
              description: existingTranslation.description ?? null,
            };
          });
        }
      }

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
          throw new Error(
            "Bu ürün kodu başka bir ürün tarafından kullanılıyor"
          );
        }
      }

      // Fakturownia sync: Sadece tax ve price senkronize edilir (stok lokal yönetilir)
      let finalTax = validateTaxRate(payload.tax);
      const finalStock = payload.stock ?? 0;
      let syncStatus: "synced" | "pending" | "error" = "pending";
      let lastSyncedAt: Date | null = null;

      if (existingProduct.fakturowniaProductId) {
        try {
          logger.info(
            { fakturowniaProductId: existingProduct.fakturowniaProductId, context: "AdminUpdateProductService" },
            "Fakturownia güncelleniyor"
          );

          const fakturowniaResponse = await fakturowniaService.updateProduct(
            existingProduct.fakturowniaProductId,
            {
              tax: finalTax,
              price: payload.price,
            }
          );

          // Fakturownia'dan sadece tax değerini al (price ve stock lokal yönetilir)
          finalTax = validateTaxRate(fakturowniaResponse.tax);
          syncStatus = "synced";
          lastSyncedAt = new Date();
        } catch (fakturowniaError) {
          logger.error({ error: fakturowniaError, context: "AdminUpdateProductService" }, "Fakturownia güncelleme hatası");
          syncStatus = "error";
          // Fakturownia fail olursa devam et ama sync status error olarak işaretle
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
            stock: finalStock, // Fakturownia'dan gelen değer
            tax: finalTax, // Fakturownia'dan gelen değer (integer)
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
            syncStatus: syncStatus,
            lastSyncedAt: lastSyncedAt,
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

      // Redis'e stok değerini sync et
      try {
        await RedisStockService.setStockLevel(payload.productId, finalStock);
        logger.info(
          { productId: payload.productId, stock: finalStock, context: "AdminUpdateProductService" },
          "Redis stok güncellendi"
        );
      } catch (error) {
        logger.warn(
          { productId: payload.productId, error, context: "AdminUpdateProductService" },
          "Redis stok güncellenemedi"
        );
        // Redis hatası ürün güncellemeyi engellemez
      }

      return {
        success: true,
        productId: payload.productId,
        message: "Ürün güncellendi",
      };
    } catch (error) {
      logger.error({ error, context: "AdminUpdateProductService" }, "Admin ürün güncelleme hatası");
      throw new Error(
        error instanceof Error ? error.message : "Ürün güncellenemedi"
      );
    }
  }
}
