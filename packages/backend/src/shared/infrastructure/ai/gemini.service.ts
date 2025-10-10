import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyBfC4-CKPrrgNrvmIiebBjZLhkuIFIsR0Q";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  context?: string;
}

interface BatchTranslationRequest {
  texts: string[];
  fromLanguage: string;
  toLanguage: string;
  context?: string;
}

export class GeminiTranslationService {
  static async translateText({
    text,
    fromLanguage,
    toLanguage,
    context,
  }: TranslationRequest): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text;
    }

    const contextInstruction = context ? `Context: This is ${context}. ` : "";

    const culturalRules = fromLanguage === "Turkish" && context?.includes("product")
      ? `You are translating Turkish to ${toLanguage}. Follow these rules:

1. TRANSLATE EVERY WORD: Translate all Turkish words to ${toLanguage}. Do not leave any Turkish words untranslated.

2. LITERAL TRANSLATION: Translate word-by-word with exact meaning. Do NOT use cultural equivalents, country names, or nationalities.

3. CAPITALIZATION: If input is ALL UPPERCASE, translate with normal Title Case. Otherwise keep normal case.

4. NO COPYING: Never copy Turkish text. Always provide actual ${toLanguage} translation.

Return ONLY the translated text in ${toLanguage}.
`
      : "";

    const prompt = `${contextInstruction}${culturalRules}Translate the following text from ${fromLanguage} to ${toLanguage}. Return ONLY the translated text, no explanations or extra text.\n\nText to translate:\n${text}`;

    try {
      const result = await model.generateContent(prompt);
      const translatedText = result.response.text().trim();
      return translatedText;
    } catch (error) {
      console.error("Gemini translation error:", error);
      throw new Error(
        `Translation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static async translateBatch({
    texts,
    fromLanguage,
    toLanguage,
    context,
  }: BatchTranslationRequest): Promise<string[]> {
    if (texts.length === 0) {
      return texts;
    }

    const contextInstruction = context ? `Context: These are ${context}. ` : "";

    const culturalRules = fromLanguage === "Turkish" && context?.includes("product")
      ? `You are translating Turkish to ${toLanguage}. Follow these rules:

1. TRANSLATE EVERY WORD: Translate all Turkish words to ${toLanguage}. Do not leave any Turkish words untranslated.

2. LITERAL TRANSLATION: Translate word-by-word with exact meaning. Do NOT use cultural equivalents, country names, or nationalities.

3. CAPITALIZATION: If input is ALL UPPERCASE, translate with normal Title Case. Otherwise keep normal case.

4. NO COPYING: Never copy Turkish text. Always provide actual ${toLanguage} translation.

Return ONLY the translated text in ${toLanguage}.
`
      : "";

    const numberedTexts = texts
      .map((text, index) => `${index + 1}. ${text}`)
      .join("\n");

    const prompt = `${contextInstruction}${culturalRules}Translate the following texts from ${fromLanguage} to ${toLanguage}. Return ONLY the translations in the same numbered format, no explanations.\n\n${numberedTexts}`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      const translations = responseText
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          const match = line.match(/^\d+\.\s*(.+)$/);
          return match ? match[1].trim() : line.trim();
        });

      if (translations.length !== texts.length) {
        console.warn(
          `Translation count mismatch: expected ${texts.length}, got ${translations.length}`
        );
        return texts.map((_, index) =>
          translations[index] !== undefined ? translations[index] : texts[index]
        );
      }

      return translations;
    } catch (error) {
      console.error("Gemini batch translation error:", error);
      return texts;
    }
  }

  static async translateObject(
    obj: Record<string, unknown>,
    fromLanguage: string,
    toLanguage: string
  ): Promise<Record<string, unknown>> {
    const keys = Object.keys(obj);
    const values = Object.values(obj).map((v) => String(v));

    const translatedKeys = await this.translateBatch({
      texts: keys,
      fromLanguage,
      toLanguage,
      context: "object keys",
    });

    const translatedValues = await this.translateBatch({
      texts: values,
      fromLanguage,
      toLanguage,
      context: "object values",
    });

    const result: Record<string, unknown> = {};
    translatedKeys.forEach((key, index) => {
      result[key] = translatedValues[index];
    });

    return result;
  }
}
