import { eq } from "drizzle-orm";

import { ProductTranslationService } from "../../../../../shared/infrastructure/ai/product-translation.service";
import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  categories,
  categoryTranslations,
} from "../../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";

import type { AdminUpdateCategoryPayload } from "./category.types";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export class AdminUpdateCategoryService {
  static async execute(payload: AdminUpdateCategoryPayload) {
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.id, payload.categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      throw new Error("Kategori bulunamadı");
    }

    const turkishTranslation = payload.translations.find(t => t.languageCode === "tr");
    if (!turkishTranslation) {
      throw new Error("Türkçe çeviri zorunludur");
    }

    let finalTranslations;
    let finalSlug = payload.slug;

    if (!finalSlug || finalSlug.trim().length === 0) {
      finalSlug = generateSlug(turkishTranslation.name);
      logger.info({ slug: finalSlug, context: "AdminUpdateCategoryService" }, "Generated slug from Turkish name");
    }

    const existingTranslations = await db
      .select()
      .from(categoryTranslations)
      .where(eq(categoryTranslations.categoryId, payload.categoryId));

    const manualTranslationsProvided = payload.translations.length === 3;

    if (manualTranslationsProvided) {
      logger.info({ context: "AdminUpdateCategoryService" }, "Using manual category translations (skipping Gemini)");
      finalTranslations = payload.translations;
    } else {
      const existingTurkish = existingTranslations.find(t => t.languageCode === "tr");
      const nameChanged = existingTurkish?.name !== turkishTranslation.name;

      if (nameChanged || existingTranslations.length < 3) {
        logger.info({ context: "AdminUpdateCategoryService" }, "Generating category translations with Gemini");
        const generatedTranslations = await ProductTranslationService.generateCategoryTranslations(
          turkishTranslation.name
        );

        logger.info({ translations: generatedTranslations, context: "AdminUpdateCategoryService" }, "Generated translations");

        finalTranslations = [
          { languageCode: "tr" as const, name: generatedTranslations.tr },
          { languageCode: "en" as const, name: generatedTranslations.en },
          { languageCode: "pl" as const, name: generatedTranslations.pl },
        ];
        logger.info({ context: "AdminUpdateCategoryService" }, "Category translations generated successfully");
      } else {
        logger.info({ context: "AdminUpdateCategoryService" }, "Reusing existing translations (no changes detected)");
        finalTranslations = existingTranslations.map(t => ({
          languageCode: t.languageCode as "tr" | "en" | "pl",
          name: t.name,
        }));
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(categories)
        .set({ slug: finalSlug })
        .where(eq(categories.id, payload.categoryId));

      await tx
        .delete(categoryTranslations)
        .where(eq(categoryTranslations.categoryId, payload.categoryId));

      const translationInserts = finalTranslations.map((translation) => ({
        categoryId: payload.categoryId,
        languageCode: translation.languageCode,
        name: translation.name,
      }));

      await tx.insert(categoryTranslations).values(translationInserts);
    });

    return {
      success: true,
      categoryId: payload.categoryId,
      message: "Kategori başarıyla güncellendi",
    };
  }
}
