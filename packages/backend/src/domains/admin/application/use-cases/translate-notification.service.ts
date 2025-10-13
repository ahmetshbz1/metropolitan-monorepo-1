import { GeminiTranslationService } from "../../../../shared/infrastructure/ai/gemini.service";

interface TranslationResult {
  en: string;
  pl: string;
}

export class TranslateNotificationService {
  static async translateBoth(turkishText: string): Promise<TranslationResult> {
    try {
      const [enTranslation, plTranslation] = await Promise.all([
        GeminiTranslationService.translateText({
          text: turkishText,
          fromLanguage: "Turkish",
          toLanguage: "English",
          context: "push notification text",
        }),
        GeminiTranslationService.translateText({
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
      console.error("Translation error:", error);
      throw new Error(
        `Çeviri başarısız: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  }
}
