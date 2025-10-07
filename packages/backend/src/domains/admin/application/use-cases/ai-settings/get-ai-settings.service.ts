import { db } from "../../../../../shared/infrastructure/database/connection";
import { aiSettings } from "../../../../../shared/infrastructure/database/schema";

export interface AISettingsResponse {
  id: string;
  provider: string;
  apiKey: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetAISettingsService {
  static async execute(): Promise<AISettingsResponse | null> {
    const settings = await db.select().from(aiSettings).limit(1);

    if (settings.length === 0) {
      return null;
    }

    return settings[0];
  }
}
