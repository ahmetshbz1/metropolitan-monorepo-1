//  "product.types.ts"
//  metropolitan backend
//  Admin ürün tipleri

export const SUPPORTED_LANGUAGES = ["tr", "en", "pl"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface AdminProductTranslationInput {
  languageCode: SupportedLanguage;
  name: string;
  fullName?: string;
  description?: string;
}

export interface AdminProductPayload {
  productCode: string;
  categoryId?: string | null;
  brand?: string | null;
  size?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  stock?: number | null;
  allergens?: string[] | null;
  nutritionalValues?: Record<string, unknown> | null;
  netQuantity?: string | null;
  expiryDate?: string | null;
  storageConditions?: string | null;
  manufacturerInfo?: Record<string, unknown> | null;
  originCountry?: string | null;
  badges?: string[] | null;
  individualPrice?: number | null;
  corporatePrice?: number | null;
  minQuantityIndividual?: number | null;
  minQuantityCorporate?: number | null;
  quantityPerBox?: number | null;
  translations: AdminProductTranslationInput[];
}

export interface AdminUpdateProductPayload extends AdminProductPayload {
  productId: string;
}
