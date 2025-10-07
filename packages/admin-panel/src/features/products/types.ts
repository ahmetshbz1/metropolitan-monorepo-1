import type { SupportedLanguage } from "./constants";

export interface AdminProductTranslation {
  languageCode: SupportedLanguage;
  name: string;
  fullName?: string;
  description?: string;
}

export interface AdminProductPayload {
  productCode: string;
  categoryId?: string;
  brand?: string;
  size?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  stock?: number;
  allergens?: string[];
  nutritionalValues?: Record<string, unknown>;
  netQuantity?: string;
  expiryDate?: string;
  storageConditions?: string;
  manufacturerInfo?: Record<string, unknown>;
  originCountry?: string;
  badges?: string[];
  individualPrice?: number;
  corporatePrice?: number;
  minQuantityIndividual?: number;
  minQuantityCorporate?: number;
  quantityPerBox?: number;
  translations: AdminProductTranslation[];
}
