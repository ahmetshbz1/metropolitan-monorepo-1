//  "get-products.service.ts"
//  metropolitan backend
//  Admin ürün listeleme servisi

import { desc, eq, sql } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  productTranslations,
  products,
} from "../../../../../shared/infrastructure/database/schema";
import type { SupportedLanguage } from "./product.types";
import { SUPPORTED_LANGUAGES } from "./product.types";

interface GetProductsParams {
  limit?: number;
  offset?: number;
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
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed.map((item) => String(item));
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
  static async execute({ limit = 20, offset = 0 }: GetProductsParams) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);

    const rows = await db
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
        individualPrice: products.individualPrice,
        corporatePrice: products.corporatePrice,
        minQuantityIndividual: products.minQuantityIndividual,
        minQuantityCorporate: products.minQuantityCorporate,
        quantityPerBox: products.quantityPerBox,
        netQuantity: products.netQuantity,
        expiryDate: products.expiryDate,
        storageConditions: products.storageConditions,
        manufacturerInfo: products.manufacturerInfo,
        originCountry: products.originCountry,
        allergens: products.allergens,
        badges: products.badges,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        translationLanguage: productTranslations.languageCode,
        translationName: productTranslations.name,
        translationFullName: productTranslations.fullName,
        translationDescription: productTranslations.description,
      })
      .from(products)
      .leftJoin(productTranslations, eq(products.id, productTranslations.productId))
      .orderBy(desc(products.createdAt))
      .limit(safeLimit)
      .offset(safeOffset);

    const itemsMap = new Map<string, AdminProductListItem>();

    rows.forEach((row) => {
      if (!itemsMap.has(row.productId)) {
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
          individualPrice: toNumber(row.individualPrice),
          corporatePrice: toNumber(row.corporatePrice),
          minQuantityIndividual: toInt(row.minQuantityIndividual, 1),
          minQuantityCorporate: toInt(row.minQuantityCorporate, 1),
          quantityPerBox: row.quantityPerBox ? toInt(row.quantityPerBox) : null,
          netQuantity: row.netQuantity,
          expiryDate: row.expiryDate ? row.expiryDate.toISOString() : null,
          storageConditions: row.storageConditions,
          manufacturerInfo: parseJsonObject(row.manufacturerInfo),
          originCountry: row.originCountry,
          allergens: parseJsonArray(row.allergens),
          badges: parseJsonArray(row.badges),
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
      }

      if (!row.translationLanguage) {
        return;
      }

      const item = itemsMap.get(row.productId);
      if (!item) return;

      const lang = row.translationLanguage as SupportedLanguage;
      if (!SUPPORTED_LANGUAGES.includes(lang)) {
        return;
      }

      item.translations[lang] = {
        name: row.translationName ?? "",
        fullName: row.translationFullName ?? null,
        description: row.translationDescription ?? null,
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
