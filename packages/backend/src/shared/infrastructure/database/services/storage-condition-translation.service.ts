//  "storage-condition-translation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 15.01.2025.

import { and, eq, inArray } from "drizzle-orm";
import { db as sharedDb } from "../connection";
import { storageConditionTranslations } from "../schema";

export class StorageConditionTranslationService {
  private db = sharedDb;

  async getTranslation(
    conditionKey: string,
    languageCode: string
  ): Promise<string | null> {
    const result = await this.db
      .select()
      .from(storageConditionTranslations)
      .where(
        and(
          eq(storageConditionTranslations.conditionKey, conditionKey),
          eq(storageConditionTranslations.languageCode, languageCode)
        )
      )
      .limit(1);

    return result[0]?.translation || null;
  }

  async getAllTranslations(
    conditionKey: string
  ): Promise<Record<string, string>> {
    const results = await this.db
      .select()
      .from(storageConditionTranslations)
      .where(eq(storageConditionTranslations.conditionKey, conditionKey));

    const translations: Record<string, string> = {};
    for (const result of results) {
      translations[result.languageCode] = result.translation;
    }

    return translations;
  }

  async getBatchTranslations(
    conditionKeys: string[],
    languageCode: string
  ): Promise<Record<string, string>> {
    if (conditionKeys.length === 0) {
      return {};
    }

    const results = await this.db
      .select()
      .from(storageConditionTranslations)
      .where(
        and(
          inArray(storageConditionTranslations.conditionKey, conditionKeys),
          eq(storageConditionTranslations.languageCode, languageCode)
        )
      );

    const translations: Record<string, string> = {};
    for (const result of results) {
      translations[result.conditionKey] = result.translation;
    }

    return translations;
  }
}
