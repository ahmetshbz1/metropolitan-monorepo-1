import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { categories } from "../../../../../shared/infrastructure/database/schema";

export class AdminDeleteCategoryService {
  static async execute(categoryId: string) {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    if (result.length === 0) {
      throw new Error("Kategori bulunamadı");
    }

    return {
      success: true,
      message: "Kategori başarıyla silindi",
    };
  }
}
