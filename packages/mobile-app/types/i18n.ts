// i18n/translation types for the mobile app

import type { TFunction } from "i18next";

// Re-export the translation function type
export type TranslationFunction = TFunction;

// Helper type for components that receive translation function as prop
export interface WithTranslation {
  t: TranslationFunction;
}