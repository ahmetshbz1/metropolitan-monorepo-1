//  "allergen-translation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 15.01.2025.

import { and, eq } from "drizzle-orm";

import { db as sharedDb } from "../connection";
import { allergenTranslations } from "../schema";

export class AllergenTranslationService {
  private db = sharedDb;

  async getTranslation(
    allergenKey: string,
    languageCode: string
  ): Promise<string | null> {
    const result = await this.db
      .select()
      .from(allergenTranslations)
      .where(
        and(
          eq(allergenTranslations.allergenKey, allergenKey),
          eq(allergenTranslations.languageCode, languageCode)
        )
      )
      .limit(1);

    return result[0]?.translation || null;
  }

  async getAllTranslations(
    allergenKey: string
  ): Promise<Record<string, string>> {
    const results = await this.db
      .select()
      .from(allergenTranslations)
      .where(eq(allergenTranslations.allergenKey, allergenKey));

    const translations: Record<string, string> = {};
    for (const result of results) {
      translations[result.languageCode] = result.translation;
    }

    return translations;
  }
}
