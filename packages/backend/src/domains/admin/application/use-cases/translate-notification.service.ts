import { GoogleGenerativeAI } from "@google/generative-ai";

import { GetAISettingsService } from "./ai-settings/get-ai-settings.service";

interface TranslationRequest {
  text: string;
  targetLanguage: "en" | "pl";
}

interface TranslationResult {
  translatedText: string;
  language: "en" | "pl";
}

export class TranslateNotificationService {
  static async translate(
    request: TranslationRequest
  ): Promise<TranslationResult> {
    try {
      // AI Settings'den API key al
      const aiSettings = await GetAISettingsService.execute();

      if (!aiSettings) {
        throw new Error(
          "AI ayarları bulunamadı. Lütfen AI ayarlarını yapılandırın."
        );
      }

      if (aiSettings.provider !== "gemini") {
        throw new Error("Sadece Gemini provider desteklenmektedir");
      }

      const genAI = new GoogleGenerativeAI(aiSettings.apiKey);
      const model = genAI.getGenerativeModel({ model: aiSettings.model });

      const targetLangName =
        request.targetLanguage === "en" ? "English" : "Polish";

      const prompt = `Translate the following Turkish notification text to ${targetLangName}.
Keep it natural and conversational, suitable for mobile push notifications.
Only respond with the translated text, nothing else.

Turkish text: ${request.text}`;

      const result = await model.generateContent(prompt);
      const translatedText = result.response.text().trim();

      return {
        translatedText,
        language: request.targetLanguage,
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

  static async translateBoth(turkishText: string): Promise<{
    en: string;
    pl: string;
  }> {
    try {
      const [enResult, plResult] = await Promise.all([
        this.translate({ text: turkishText, targetLanguage: "en" }),
        this.translate({ text: turkishText, targetLanguage: "pl" }),
      ]);

      return {
        en: enResult.translatedText,
        pl: plResult.translatedText,
      };
    } catch (error) {
      console.error("Batch translation error:", error);
      throw error;
    }
  }
}
