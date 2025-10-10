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

export class OpenAITranslationService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-3.5-turbo") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async translateText({
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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data: unknown = await response.json();
      const translatedText = (data as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error("Empty response from OpenAI API");
      }

      return translatedText;
    } catch (error) {
      console.error("OpenAI translation error:", error);
      throw new Error(
        `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async translateBatch({
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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data: unknown = await response.json();
      const responseText = (data as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content?.trim();

      if (!responseText) {
        throw new Error("Empty response from OpenAI API");
      }

      const translations = responseText
        .split("\n")
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => {
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
      console.error("OpenAI batch translation error:", error);
      return texts;
    }
  }

  async translateObject(
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
