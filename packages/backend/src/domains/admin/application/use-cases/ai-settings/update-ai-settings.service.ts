import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { aiSettings } from "../../../../../shared/infrastructure/database/schema";
import { TranslationProviderFactory } from "../../../../../shared/infrastructure/ai/translation-provider.factory";

export interface UpdateAISettingsInput {
  provider: string;
  apiKey: string;
  model: string;
}

export interface AISettingsResponse {
  id: string;
  provider: string;
  apiKey: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateAISettingsService {
  static async execute(
    input: UpdateAISettingsInput
  ): Promise<AISettingsResponse> {
    const existingSettings = await db.select().from(aiSettings).limit(1);

    if (existingSettings.length === 0) {
      const [newSettings] = await db
        .insert(aiSettings)
        .values({
          provider: input.provider,
          apiKey: input.apiKey,
          model: input.model,
        })
        .returning();

      TranslationProviderFactory.clearCache();
      return newSettings;
    }

    const [updatedSettings] = await db
      .update(aiSettings)
      .set({
        provider: input.provider,
        apiKey: input.apiKey,
        model: input.model,
        updatedAt: new Date(),
      })
      .where(eq(aiSettings.id, existingSettings[0].id))
      .returning();

    TranslationProviderFactory.clearCache();
    return updatedSettings;
  }
}
