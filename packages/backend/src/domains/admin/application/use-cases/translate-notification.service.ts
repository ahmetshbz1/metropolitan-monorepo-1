import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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
        `Çeviri başarısız: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`
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
