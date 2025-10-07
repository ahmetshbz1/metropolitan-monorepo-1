import { desc, inArray } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  categories,
  categoryTranslations,
} from "../../../../../shared/infrastructure/database/schema";
import type { AdminCategory, SupportedLanguage } from "./category.types";

export class AdminGetCategoriesService {
  static async execute(): Promise<{ items: AdminCategory[]; total: number }> {
    const allCategories = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .orderBy(desc(categories.createdAt));

    if (allCategories.length === 0) {
      return { items: [], total: 0 };
    }

    const categoryIds = allCategories.map((cat) => cat.id);

    const allTranslations = await db
      .select({
        categoryId: categoryTranslations.categoryId,
        languageCode: categoryTranslations.languageCode,
        name: categoryTranslations.name,
      })
      .from(categoryTranslations)
      .where(inArray(categoryTranslations.categoryId, categoryIds));

    const translationMap = new Map<string, Record<string, { name: string }>>();

    for (const translation of allTranslations) {
      if (!translationMap.has(translation.categoryId)) {
        translationMap.set(translation.categoryId, {});
      }
      const catTranslations = translationMap.get(translation.categoryId)!;
      catTranslations[translation.languageCode] = {
        name: translation.name,
      };
    }

    const items: AdminCategory[] = allCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      createdAt: category.createdAt.toISOString(),
      translations: (translationMap.get(category.id) || {}) as Record<
        SupportedLanguage,
        { name: string }
      >,
    }));

    return {
      items,
      total: items.length,
    };
  }
}
