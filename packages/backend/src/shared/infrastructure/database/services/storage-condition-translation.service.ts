//  "storage-condition-translation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 15.01.2025.

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { storageConditionTranslations } from "../schema";

export class StorageConditionTranslationService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const client = postgres({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });

    this.db = drizzle(client, { schema: { storageConditionTranslations } });
  }

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
}
