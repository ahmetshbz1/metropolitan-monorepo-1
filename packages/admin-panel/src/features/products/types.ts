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

export interface ProductTranslations {
  tr: {
    name: string;
    fullName: string | null;
    description: string | null;
  };
  en: {
    name: string;
    fullName: string | null;
    description: string | null;
  };
  pl: {
    name: string;
    fullName: string | null;
    description: string | null;
  };
}

export interface AdminProduct {
  productId: string;
  productCode: string;
  categoryId: string | null;
  brand: string | null;
  size: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  stock: number;
  individualPrice: number | null;
  corporatePrice: number | null;
  minQuantityIndividual: number;
  minQuantityCorporate: number;
  quantityPerBox: number | null;
  netQuantity: string | null;
  expiryDate: string | null;
  storageConditions: string | null;
  manufacturerInfo: Record<string, unknown> | null;
  originCountry: string | null;
  allergens: string[] | null;
  badges: string[] | null;
  translations: ProductTranslations;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  items: AdminProduct[];
}
