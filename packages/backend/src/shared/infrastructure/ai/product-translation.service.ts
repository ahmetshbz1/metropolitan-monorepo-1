import { GeminiTranslationService } from "./gemini.service";
import type {
  AdminProductTranslationInput,
  SupportedLanguage,
} from "../../../domains/admin/application/use-cases/products/product.types";

interface ProductTranslationData {
  name: string;
  fullName?: string;
  description?: string;
  storageConditions?: string;
  allergens?: string[];
  badges?: string[];
  nutritionalValues?: Record<string, unknown>;
  manufacturerInfo?: Record<string, unknown>;
}

export class ProductTranslationService {
  static async generateCategoryTranslations(
    turkishName: string
  ): Promise<Record<SupportedLanguage, string>> {
    const translations: Record<SupportedLanguage, string> = {
      tr: turkishName,
      en: "",
      pl: "",
    };

    try {
      translations.en = await GeminiTranslationService.translateText({
        text: turkishName,
        fromLanguage: "Turkish",
        toLanguage: "English",
        context: "category name",
      });

      translations.pl = await GeminiTranslationService.translateText({
        text: turkishName,
        fromLanguage: "Turkish",
        toLanguage: "Polish",
        context: "category name",
      });
    } catch (error) {
      console.error("Category translation failed:", error);
      translations.en = turkishName;
      translations.pl = turkishName;
    }

    return translations;
  }

  static async generateTranslations(
    turkishData: ProductTranslationData
  ): Promise<
    Record<SupportedLanguage, Omit<ProductTranslationData, "allergens" | "badges" | "nutritionalValues" | "manufacturerInfo">>
  > {
    const translations: Record<
      SupportedLanguage,
      Omit<ProductTranslationData, "allergens" | "badges" | "nutritionalValues" | "manufacturerInfo">
    > = {
      tr: {
        name: turkishData.name,
        fullName: turkishData.fullName,
        description: turkishData.description,
        storageConditions: turkishData.storageConditions,
      },
      en: {
        name: "",
        fullName: undefined,
        description: undefined,
        storageConditions: undefined,
      },
      pl: {
        name: "",
        fullName: undefined,
        description: undefined,
        storageConditions: undefined,
      },
    };

    try {
      const nameTranslations = await GeminiTranslationService.translateBatch({
        texts: [turkishData.name, turkishData.name],
        fromLanguage: "Turkish",
        toLanguage: "English and Polish",
        context: "product names",
      });

      translations.en.name = await GeminiTranslationService.translateText({
        text: turkishData.name,
        fromLanguage: "Turkish",
        toLanguage: "English",
        context: "product name",
      });

      translations.pl.name = await GeminiTranslationService.translateText({
        text: turkishData.name,
        fromLanguage: "Turkish",
        toLanguage: "Polish",
        context: "product name",
      });

      if (turkishData.fullName) {
        translations.en.fullName = await GeminiTranslationService.translateText(
          {
            text: turkishData.fullName,
            fromLanguage: "Turkish",
            toLanguage: "English",
            context: "product full name",
          }
        );

        translations.pl.fullName = await GeminiTranslationService.translateText(
          {
            text: turkishData.fullName,
            fromLanguage: "Turkish",
            toLanguage: "Polish",
            context: "product full name",
          }
        );
      }

      if (turkishData.description) {
        translations.en.description =
          await GeminiTranslationService.translateText({
            text: turkishData.description,
            fromLanguage: "Turkish",
            toLanguage: "English",
            context: "product description",
          });

        translations.pl.description =
          await GeminiTranslationService.translateText({
            text: turkishData.description,
            fromLanguage: "Turkish",
            toLanguage: "Polish",
            context: "product description",
          });
      }

      if (turkishData.storageConditions) {
        translations.en.storageConditions =
          await GeminiTranslationService.translateText({
            text: turkishData.storageConditions,
            fromLanguage: "Turkish",
            toLanguage: "English",
            context: "storage conditions",
          });

        translations.pl.storageConditions =
          await GeminiTranslationService.translateText({
            text: turkishData.storageConditions,
            fromLanguage: "Turkish",
            toLanguage: "Polish",
            context: "storage conditions",
          });
      }
    } catch (error) {
      console.error("Translation generation failed:", error);
    }

    return translations;
  }

  static async translateAllergens(
    allergens: string[]
  ): Promise<Record<SupportedLanguage, string[]>> {
    if (allergens.length === 0) {
      return { tr: [], en: [], pl: [] };
    }

    try {
      const enTranslations = await GeminiTranslationService.translateBatch({
        texts: allergens,
        fromLanguage: "Turkish",
        toLanguage: "English",
        context: "food allergens",
      });

      const plTranslations = await GeminiTranslationService.translateBatch({
        texts: allergens,
        fromLanguage: "Turkish",
        toLanguage: "Polish",
        context: "food allergens",
      });

      return {
        tr: allergens,
        en: enTranslations,
        pl: plTranslations,
      };
    } catch (error) {
      console.error("Allergen translation failed:", error);
      return { tr: allergens, en: allergens, pl: allergens };
    }
  }

  static async translateBadges(
    badges: string[]
  ): Promise<Record<SupportedLanguage, string[]>> {
    if (badges.length === 0) {
      return { tr: [], en: [], pl: [] };
    }

    try {
      const enTranslations = await GeminiTranslationService.translateBatch({
        texts: badges,
        fromLanguage: "Turkish",
        toLanguage: "English",
        context: "product badges (like Organic, Vegan, Halal)",
      });

      const plTranslations = await GeminiTranslationService.translateBatch({
        texts: badges,
        fromLanguage: "Turkish",
        toLanguage: "Polish",
        context: "product badges (like Organic, Vegan, Halal)",
      });

      return {
        tr: badges,
        en: enTranslations,
        pl: plTranslations,
      };
    } catch (error) {
      console.error("Badge translation failed:", error);
      return { tr: badges, en: badges, pl: badges };
    }
  }

  static async translateNutritionalValues(
    nutritionalValues: Record<string, unknown>
  ): Promise<Record<SupportedLanguage, Record<string, unknown>>> {
    if (Object.keys(nutritionalValues).length === 0) {
      return { tr: {}, en: {}, pl: {} };
    }

    try {
      const enTranslated = await GeminiTranslationService.translateObject(
        nutritionalValues,
        "Turkish",
        "English"
      );

      const plTranslated = await GeminiTranslationService.translateObject(
        nutritionalValues,
        "Turkish",
        "Polish"
      );

      return {
        tr: nutritionalValues,
        en: enTranslated,
        pl: plTranslated,
      };
    } catch (error) {
      console.error("Nutritional values translation failed:", error);
      return {
        tr: nutritionalValues,
        en: nutritionalValues,
        pl: nutritionalValues,
      };
    }
  }

  static async translateManufacturerInfo(
    manufacturerInfo: Record<string, unknown>
  ): Promise<Record<SupportedLanguage, Record<string, unknown>>> {
    if (Object.keys(manufacturerInfo).length === 0) {
      return { tr: {}, en: {}, pl: {} };
    }

    try {
      const enTranslated = await GeminiTranslationService.translateObject(
        manufacturerInfo,
        "Turkish",
        "English"
      );

      const plTranslated = await GeminiTranslationService.translateObject(
        manufacturerInfo,
        "Turkish",
        "Polish"
      );

      return {
        tr: manufacturerInfo,
        en: enTranslated,
        pl: plTranslated,
      };
    } catch (error) {
      console.error("Manufacturer info translation failed:", error);
      return {
        tr: manufacturerInfo,
        en: manufacturerInfo,
        pl: manufacturerInfo,
      };
    }
  }
}
