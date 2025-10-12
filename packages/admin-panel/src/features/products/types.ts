import type { SupportedLanguage } from "./constants";

export interface ProductImageInfo {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

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
  tax?: number;
  allergens?: string[];
  nutritionalValues?: {
    energy?: string;
    fat?: string;
    saturatedFat?: string;
    carbohydrates?: string;
    sugar?: string;
    protein?: string;
    salt?: string;
  };
  netQuantity?: string;
  expiryDate?: string;
  storageConditions?: string;
  manufacturerInfo?: Record<string, unknown>;
  originCountry?: string;
  badges?: {
    halal?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    organic?: boolean;
    lactoseFree?: boolean;
  };
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
  tax: number | null;
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
  badges: {
    halal?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    organic?: boolean;
    lactoseFree?: boolean;
  } | null;
  nutritionalValues: {
    energy?: string;
    fat?: string;
    saturatedFat?: string;
    carbohydrates?: string;
    sugar?: string;
    protein?: string;
    salt?: string;
  } | null;
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

export interface ProductImportError {
  row: number;
  message: string;
}

export interface ProductImportSummary {
  processed: number;
  updated: number;
  skipped: number;
  errors: ProductImportError[];
}
