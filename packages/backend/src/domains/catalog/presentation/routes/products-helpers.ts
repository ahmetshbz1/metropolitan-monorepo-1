//  "products-helpers.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { StorageConditionTranslationService } from "../../../../shared/infrastructure/database/services/storage-condition-translation.service";

/**
 * Allergen string veya JSON'ı güvenli şekilde parse eder
 */
export const safeParseAllergens = (allergens: string | null): string[] | undefined => {
  if (!allergens) return undefined;
  try {
    const parsed = JSON.parse(allergens);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === "string") {
      return [parsed];
    }
    return undefined;
  } catch {
    return [allergens];
  }
};

/**
 * Request headers'tan base URL'i çıkarır
 * X-Forwarded-Proto ve Host header'larını kontrol eder (proxy/load balancer için)
 */
export const getBaseUrl = (request: Request): string => {
  const xfProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');

  if (xfProto && host) {
    return `${xfProto}://${host}`;
  }

  return new URL(request.url).origin;
};

/**
 * Ham ürün verisini formatlanmış ürün objesine dönüştürür
 */
interface RawProduct {
  id: string;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string;
  individualPrice: string | null;
  corporatePrice: string | null;
  minQuantityIndividual: number | null;
  minQuantityCorporate: number | null;
  quantityPerBox: number | null;
  currency: string;
  stock: number | null;
  categorySlug: string | null;
  brand: string | null;
  size?: string | null;
  allergens?: string | null;
  nutritionalValues?: string | null;
  netQuantity?: string | null;
  expiryDate?: string | null;
  storageConditions?: string | null;
  manufacturerInfo?: string | null;
  originCountry?: string | null;
  badges?: string | null;
}

interface FormattedProduct {
  id: string;
  name: string | null;
  description: string | null;
  image: string;
  price: number;
  individualPrice?: number;
  corporatePrice?: number;
  minQuantityIndividual: number;
  minQuantityCorporate: number;
  quantityPerBox?: number;
  currency: string;
  stock: number;
  category: string | null;
  brand: string;
  size?: string;
  allergens?: string[];
  nutritionalValues?: Record<string, unknown>;
  netQuantity?: string;
  expiryDate?: string;
  storageConditions?: string;
  manufacturerInfo?: Record<string, unknown>;
  originCountry?: string;
  badges?: unknown[];
  rating?: number;
}

export const formatProduct = (
  product: RawProduct,
  baseUrl: string,
  userType: "individual" | "corporate",
  translatedStorageConditions?: string,
  includeRating?: boolean
): FormattedProduct => {
  const finalPrice = userType === "corporate"
    ? (product.corporatePrice ? Number(product.corporatePrice) : Number(product.price) || 0)
    : (product.individualPrice ? Number(product.individualPrice) : Number(product.price) || 0);

  const formatted: FormattedProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.imageUrl ? `${baseUrl}${product.imageUrl}` : "",
    price: finalPrice,
    individualPrice: product.individualPrice ? Number(product.individualPrice) : undefined,
    corporatePrice: product.corporatePrice ? Number(product.corporatePrice) : undefined,
    minQuantityIndividual: product.minQuantityIndividual ?? 1,
    minQuantityCorporate: product.minQuantityCorporate ?? 1,
    quantityPerBox: product.quantityPerBox ?? undefined,
    currency: product.currency,
    stock: product.stock ?? 0,
    category: product.categorySlug,
    brand: product.brand || "Yayla",
  };

  // Opsiyonel alanları sadece varsa ekle
  if (product.size) {
    formatted.size = product.size;
  }

  if (product.allergens) {
    formatted.allergens = safeParseAllergens(product.allergens);
  }

  if (product.nutritionalValues) {
    formatted.nutritionalValues = JSON.parse(product.nutritionalValues);
  }

  if (product.netQuantity) {
    formatted.netQuantity = product.netQuantity;
  }

  if (product.expiryDate) {
    formatted.expiryDate = product.expiryDate;
  }

  if (translatedStorageConditions || product.storageConditions) {
    formatted.storageConditions = translatedStorageConditions || product.storageConditions || undefined;
  }

  if (product.manufacturerInfo) {
    formatted.manufacturerInfo = JSON.parse(product.manufacturerInfo);
  }

  if (product.originCountry) {
    formatted.originCountry = product.originCountry;
  }

  if (product.badges) {
    formatted.badges = JSON.parse(product.badges);
  }

  if (includeRating) {
    formatted.rating = Math.random() * 2 + 3;
  }

  return formatted;
};

/**
 * Ürün listesini batch formatlar - N+1 sorgu problemini önler
 * Storage condition translation'ları tek seferde çeker
 */
export const formatProductList = async (
  products: RawProduct[],
  baseUrl: string,
  userType: "individual" | "corporate",
  lang: string
): Promise<FormattedProduct[]> => {
  // Batch loading için tüm unique storage conditions topla
  const storageConditionService = new StorageConditionTranslationService();
  const uniqueStorageConditions = new Set<string>();

  for (const p of products) {
    if (p.storageConditions) {
      uniqueStorageConditions.add(p.storageConditions);
    }
  }

  // Tek query ile tüm translations çek
  const storageTranslationsMap = new Map<string, string>();
  if (uniqueStorageConditions.size > 0) {
    const storageTranslations = await storageConditionService.getBatchTranslations(
      Array.from(uniqueStorageConditions),
      lang
    );
    for (const [key, translation] of Object.entries(storageTranslations)) {
      storageTranslationsMap.set(key, translation);
    }
  }

  // Memory'de map et (N+1 yok artık)
  return products.map((p) => {
    const translatedStorageConditions = p.storageConditions
      ? storageTranslationsMap.get(p.storageConditions) || p.storageConditions
      : undefined;

    return formatProduct(p, baseUrl, userType, translatedStorageConditions);
  });
};
