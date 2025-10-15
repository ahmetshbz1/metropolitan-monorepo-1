import { ProductTranslationService } from "../../../../../shared/infrastructure/ai/product-translation.service";
import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  categories,
  categoryTranslations,
} from "../../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";

import type { AdminCategoryPayload } from "./category.types";

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

export class AdminCreateCategoryService {
  static async execute(payload: AdminCategoryPayload) {
    const turkishTranslation = payload.translations.find(t => t.languageCode === "tr");
    if (!turkishTranslation) {
      throw new Error("Türkçe çeviri zorunludur");
    }

    let finalTranslations;
    let finalSlug = payload.slug;

    if (!finalSlug || finalSlug.trim().length === 0) {
      finalSlug = generateSlug(turkishTranslation.name);
      logger.info({ slug: finalSlug, context: "AdminCreateCategoryService" }, "Generated slug from Turkish name");
    }

    if (payload.translations.length === 3) {
      logger.info({ context: "AdminCreateCategoryService" }, "Using manual category translations (skipping Gemini)");
      finalTranslations = payload.translations;
    } else {
      logger.info({ context: "AdminCreateCategoryService" }, "Generating category translations with Gemini");
      const generatedTranslations = await ProductTranslationService.generateCategoryTranslations(
        turkishTranslation.name
      );

      logger.info({ translations: generatedTranslations, context: "AdminCreateCategoryService" }, "Generated translations");

      finalTranslations = [
        { languageCode: "tr" as const, name: generatedTranslations.tr },
        { languageCode: "en" as const, name: generatedTranslations.en },
        { languageCode: "pl" as const, name: generatedTranslations.pl },
      ];
      logger.info({ context: "AdminCreateCategoryService" }, "Category translations generated successfully");
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        slug: finalSlug,
      })
      .returning();

    if (!newCategory) {
      throw new Error("Kategori oluşturulamadı");
    }

    const translationInserts = finalTranslations.map((translation) => ({
      categoryId: newCategory.id,
      languageCode: translation.languageCode,
      name: translation.name,
    }));

    await db.insert(categoryTranslations).values(translationInserts);

    return {
      success: true,
      categoryId: newCategory.id,
      message: "Kategori başarıyla oluşturuldu",
    };
  }
}
