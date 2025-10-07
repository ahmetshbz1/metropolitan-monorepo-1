import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  categories,
  categoryTranslations,
} from "../../../../../shared/infrastructure/database/schema";
import type { AdminCategoryPayload } from "./category.types";

export class AdminCreateCategoryService {
  static async execute(payload: AdminCategoryPayload) {
    const [newCategory] = await db
      .insert(categories)
      .values({
        slug: payload.slug,
      })
      .returning();

    const translationInserts = payload.translations.map((translation) => ({
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
