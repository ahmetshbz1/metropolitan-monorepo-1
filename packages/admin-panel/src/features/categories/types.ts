export type SupportedLanguage = "tr" | "en" | "pl";

export interface CategoryTranslation {
  languageCode: SupportedLanguage;
  name: string;
}

export interface AdminCategoryPayload {
  slug?: string;
  translations: CategoryTranslation[];
}

export interface AdminCategory {
  id: string;
  slug: string;
  createdAt: string;
  translations: Record<SupportedLanguage, { name: string }>;
}

export interface CategoriesListResponse {
  items: AdminCategory[];
  total: number;
}
