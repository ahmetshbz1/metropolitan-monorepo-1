export const SUPPORTED_LANGUAGES = ["tr", "en", "pl"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface CategoryTranslation {
  languageCode: SupportedLanguage;
  name: string;
}

export interface AdminCategoryPayload {
  slug: string;
  translations: CategoryTranslation[];
}

export interface AdminCategory {
  id: string;
  slug: string;
  createdAt: string;
  translations: Record<SupportedLanguage, { name: string }>;
}
