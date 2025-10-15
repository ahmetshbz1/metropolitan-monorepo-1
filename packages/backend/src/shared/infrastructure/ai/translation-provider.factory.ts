import { db } from "../database/connection";
import { aiSettings } from "../database/schema";
import { logger } from "../monitoring/logger.config";

import { GeminiTranslationService } from "./gemini.service";
import { OpenAITranslationService } from "./openai.service";

export interface ITranslationService {
  translateText(params: {
    text: string;
    fromLanguage: string;
    toLanguage: string;
    context?: string;
  }): Promise<string>;

  translateBatch(params: {
    texts: string[];
    fromLanguage: string;
    toLanguage: string;
    context?: string;
  }): Promise<string[]>;

  translateObject(
    obj: Record<string, unknown>,
    fromLanguage: string,
    toLanguage: string
  ): Promise<Record<string, unknown>>;
}

let cachedSettings: { provider: string; apiKey: string; model: string } | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60000;

export class TranslationProviderFactory {
  static async getProvider(): Promise<ITranslationService> {
    const now = Date.now();

    if (cachedSettings && (now - cacheTime) < CACHE_DURATION) {
      return this.createProvider(cachedSettings.provider, cachedSettings.apiKey, cachedSettings.model);
    }

    const settings = await db.select().from(aiSettings).limit(1);

    if (settings.length === 0) {
      const defaultApiKey = "AIzaSyBfC4-CKPrrgNrvmIiebBjZLhkuIFIsR0Q";
      const defaultModel = "gemini-2.0-flash";
      logger.info("No AI settings found, using default Gemini");

      cachedSettings = { provider: "gemini", apiKey: defaultApiKey, model: defaultModel };
      cacheTime = now;

      return this.createProvider("gemini", defaultApiKey, defaultModel);
    }

    const setting = settings[0];
    cachedSettings = {
      provider: setting.provider,
      apiKey: setting.apiKey,
      model: setting.model
    };
    cacheTime = now;

    return this.createProvider(setting.provider, setting.apiKey, setting.model);
  }

  private static createProvider(provider: string, apiKey: string, model: string): ITranslationService {
    switch (provider.toLowerCase()) {
      case "openai":
        return new OpenAITranslationService(apiKey, model);
      case "gemini":
      default:
        return new GeminiTranslationService(apiKey, model);
    }
  }

  static clearCache(): void {
    cachedSettings = null;
    cacheTime = 0;
  }
}
