//  "get-products.service.ts"
//  metropolitan backend
//  Admin ürün listeleme servisi

import { desc, eq, inArray, sql, or, ilike, and } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  productTranslations,
  products,
} from "../../../../../shared/infrastructure/database/schema";
import type { SupportedLanguage } from "./product.types";
import { SUPPORTED_LANGUAGES } from "./product.types";
import type { ProductBadges, NutritionalValues } from "../../../../../shared/types/product";

interface GetProductsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

interface AdminProductListItem {
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
  badges: ProductBadges | null;
  nutritionalValues: NutritionalValues | null;
  translations: Record<SupportedLanguage, {
    name: string;
    fullName: string | null;
    description: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

const parseJsonArray = (value: string | null): string[] | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
    if (typeof parsed === "object" && parsed !== null) {
      return Object.keys(parsed).filter(key => parsed[key] === true);
    }
    if (typeof parsed === "string") {
      return [parsed];
    }
    return null;
  } catch {
    return null;
  }
};

const parseJsonObject = (value: string | null): Record<string, unknown> | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const parseBadges = (value: string | null): ProductBadges | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);

    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as ProductBadges;
    }

    if (Array.isArray(parsed)) {
      return parsed.reduce((acc, item) => {
        acc[String(item)] = true;
        return acc;
      }, {} as ProductBadges);
    }

    return null;
  } catch {
    return null;
  }
};

const parseNutritionalValues = (value: string | null): NutritionalValues | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as NutritionalValues)
      : null;
  } catch {
    return null;
  }
};

const toNumber = (value: string | number | null): number | null => {
  if (value === null) return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const toInt = (value: number | string | null | undefined, fallback = 0): number => {
  const numeric = value === null || value === undefined ? fallback : Number(value);
  return Number.isNaN(numeric) ? fallback : numeric;
};

export class AdminGetProductsService {
  static async execute({ limit = 50, offset = 0, search }: GetProductsParams) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    // Search: product_code, brand veya name (translations'da) içinde ara
    let matchingProductIds: string[] = [];
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;

      // product_translations'da name arama yap
      const matchingTranslations = await db
        .select({ productId: productTranslations.productId })
        .from(productTranslations)
        .where(ilike(productTranslations.name, searchTerm));

      matchingProductIds = matchingTranslations.map(t => t.productId);
    }

    // WHERE conditions oluştur
    const whereConditions = [];
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push(
        or(
          ilike(products.productCode, searchTerm),
          ilike(products.brand, searchTerm),
          matchingProductIds.length > 0 ? inArray(products.id, matchingProductIds) : sql`false`
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    const productRows = await db
      .select({
        productId: products.id,
        productCode: products.productCode,
        categoryId: products.categoryId,
        brand: products.brand,
        size: products.size,
        imageUrl: products.imageUrl,
        price: products.price,
        currency: products.currency,
        stock: products.stock,
        tax: products.tax,
        individualPrice: products.individualPrice,
        corporatePrice: products.corporatePrice,
        minQuantityIndividual: products.minQuantityIndividual,
        minQuantityCorporate: products.minQuantityCorporate,
        quantityPerBox: products.quantityPerBox,
        netQuantity: products.netQuantity,
        expiryDate: products.expiryDate,
        storageConditions: products.storageConditions,
        manufacturerInfo: products.manufacturerInfo,
        nutritionalValues: products.nutritionalValues,
        originCountry: products.originCountry,
        allergens: products.allergens,
        badges: products.badges,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(safeLimit)
      .offset(safeOffset);

    if (productRows.length === 0) {
      return {
        success: true,
        total: countResult?.count ?? 0,
        limit: safeLimit,
        offset: safeOffset,
        items: [],
      };
    }

    const productIds = productRows.map(p => p.productId);

    const translationRows = await db
      .select({
        productId: productTranslations.productId,
        languageCode: productTranslations.languageCode,
        name: productTranslations.name,
        fullName: productTranslations.fullName,
        description: productTranslations.description,
      })
      .from(productTranslations)
      .where(inArray(productTranslations.productId, productIds));

    const itemsMap = new Map<string, AdminProductListItem>();

    productRows.forEach((row) => {
      itemsMap.set(row.productId, {
        productId: row.productId,
        productCode: row.productCode,
        categoryId: row.categoryId,
        brand: row.brand,
        size: row.size,
        imageUrl: row.imageUrl,
        price: toNumber(row.price),
        currency: row.currency,
        stock: toInt(row.stock),
        tax: toNumber(row.tax),
        individualPrice: toNumber(row.individualPrice),
        corporatePrice: toNumber(row.corporatePrice),
        minQuantityIndividual: toInt(row.minQuantityIndividual, 1),
        minQuantityCorporate: toInt(row.minQuantityCorporate, 1),
        quantityPerBox: row.quantityPerBox ? toInt(row.quantityPerBox) : null,
        netQuantity: row.netQuantity,
        expiryDate: row.expiryDate ? row.expiryDate.toISOString() : null,
        storageConditions: row.storageConditions,
        manufacturerInfo: parseJsonObject(row.manufacturerInfo),
        nutritionalValues: parseNutritionalValues(row.nutritionalValues),
        originCountry: row.originCountry,
        allergens: parseJsonArray(row.allergens),
        badges: parseBadges(row.badges),
        translations: SUPPORTED_LANGUAGES.reduce((acc, lang) => {
          acc[lang] = {
            name: "",
            fullName: null,
            description: null,
          };
          return acc;
        }, {} as AdminProductListItem["translations"]),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      });
    });

    translationRows.forEach((translation) => {
      const item = itemsMap.get(translation.productId);
      if (!item) return;

      const lang = translation.languageCode as SupportedLanguage;
      if (!SUPPORTED_LANGUAGES.includes(lang)) {
        return;
      }

      item.translations[lang] = {
        name: translation.name ?? "",
        fullName: translation.fullName ?? null,
        description: translation.description ?? null,
      };
    });

    return {
      success: true,
      total: countResult?.count ?? 0,
      limit: safeLimit,
      offset: safeOffset,
      items: Array.from(itemsMap.values()),
    };
  }
}
