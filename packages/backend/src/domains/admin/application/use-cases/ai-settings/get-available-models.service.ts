import { db } from "../../../../../shared/infrastructure/database/connection";
import { aiSettings } from "../../../../../shared/infrastructure/database/schema";

export interface AIModel {
  id: string;
  name: string;
  description?: string;
}

export interface AvailableModelsResponse {
  gemini: AIModel[];
  openai: AIModel[];
}

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || "AIzaSyBfC4-CKPrrgNrvmIiebBjZLhkuIFIsR0Q";
const DEFAULT_OPENAI_KEY = process.env.OPENAI_API_KEY || "";

export class GetAvailableModelsService {
  static async execute(): Promise<AvailableModelsResponse> {
    const settings = await db.select().from(aiSettings).limit(1);

    let geminiKey = DEFAULT_GEMINI_KEY;
    let openaiKey = DEFAULT_OPENAI_KEY;

    if (settings.length > 0 && settings[0].apiKey) {
      const currentSettings = settings[0];

      if (currentSettings.provider === "gemini") {
        geminiKey = currentSettings.apiKey;
      } else if (currentSettings.provider === "openai") {
        openaiKey = currentSettings.apiKey;
      }
    }

    const [geminiModels, openaiModels] = await Promise.all([
      this.fetchGeminiModels(geminiKey),
      this.fetchOpenAIModels(openaiKey),
    ]);

    return {
      gemini: geminiModels,
      openai: openaiModels,
    };
  }

  private static async fetchGeminiModels(apiKey: string): Promise<AIModel[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      const models: AIModel[] = data.models
        .filter((model: { name: string; supportedGenerationMethods?: string[] }) => {
          const modelName = model.name.replace("models/", "");
          return (
            model.supportedGenerationMethods?.includes("generateContent") &&
            (modelName.startsWith("gemini-") || modelName.startsWith("models/gemini-"))
          );
        })
        .map((model: { name: string; displayName?: string; description?: string }) => {
          const id = model.name.replace("models/", "");
          return {
            id,
            name: model.displayName || id,
            description: model.description,
          };
        })
        .slice(0, 10);

      return models.length > 0 ? models : this.getFallbackGeminiModels();
    } catch (error) {
      console.error("Gemini models fetch failed:", error);
      return this.getFallbackGeminiModels();
    }
  }

  private static async fetchOpenAIModels(apiKey: string): Promise<AIModel[]> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      const models: AIModel[] = data.data
        .filter((model: { id: string }) => {
          const id = model.id;
          return (
            id.startsWith("gpt-4") ||
            id.startsWith("gpt-3.5") ||
            id.startsWith("chatgpt")
          );
        })
        .map((model: { id: string }) => ({
          id: model.id,
          name: this.formatOpenAIModelName(model.id),
          description: this.getOpenAIModelDescription(model.id),
        }))
        .sort((a: AIModel, b: AIModel) => {
          const order = ["gpt-4", "gpt-3.5", "chatgpt"];
          const aPrefix = order.find((prefix) => a.id.startsWith(prefix)) || "";
          const bPrefix = order.find((prefix) => b.id.startsWith(prefix)) || "";
          return order.indexOf(aPrefix) - order.indexOf(bPrefix);
        })
        .slice(0, 10);

      return models.length > 0 ? models : this.getFallbackOpenAIModels();
    } catch (error) {
      console.error("OpenAI models fetch failed:", error);
      return this.getFallbackOpenAIModels();
    }
  }

  private static formatOpenAIModelName(id: string): string {
    const nameMap: Record<string, string> = {
      "gpt-4o": "GPT-4o",
      "gpt-4-turbo": "GPT-4 Turbo",
      "gpt-4": "GPT-4",
      "gpt-3.5-turbo": "GPT-3.5 Turbo",
    };
    return nameMap[id] || id.toUpperCase();
  }

  private static getOpenAIModelDescription(id: string): string | undefined {
    const descMap: Record<string, string> = {
      "gpt-4o": "En gelişmiş multimodal model",
      "gpt-4-turbo": "Hızlı ve güçlü",
      "gpt-4": "Yüksek kaliteli çıktılar",
      "gpt-3.5-turbo": "Ekonomik ve hızlı",
    };
    return descMap[id];
  }

  private static getFallbackGeminiModels(): AIModel[] {
    return [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash",
        description: "En hızlı ve ekonomik model",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "Dengeli performans",
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        description: "Hızlı yanıt süreleri",
      },
    ];
  }

  private static getFallbackOpenAIModels(): AIModel[] {
    return [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "En gelişmiş multimodal model",
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Hızlı ve güçlü",
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Ekonomik ve hızlı",
      },
    ];
  }
}
