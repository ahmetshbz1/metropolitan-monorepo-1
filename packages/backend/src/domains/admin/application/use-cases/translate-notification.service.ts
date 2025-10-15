import { TranslationProviderFactory } from "../../../../shared/infrastructure/ai/translation-provider.factory";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

interface TranslationResult {
  en: string;
  pl: string;
}

export class TranslateNotificationService {
  static async translateBoth(turkishText: string): Promise<TranslationResult> {
    try {
      const provider = await TranslationProviderFactory.getProvider();

      const [enTranslation, plTranslation] = await Promise.all([
        provider.translateText({
          text: turkishText,
          fromLanguage: "Turkish",
          toLanguage: "English",
          context: "push notification text",
        }),
        provider.translateText({
          text: turkishText,
          fromLanguage: "Turkish",
          toLanguage: "Polish",
          context: "push notification text",
        }),
      ]);

      return {
        en: enTranslation,
        pl: plTranslation,
      };
    } catch (error) {
      logger.error({ error, context: "TranslateNotificationService" }, "Translation error");
      throw new Error(
        `Çeviri başarısız: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  }
}
