//  "get-product.service.ts"
//  metropolitan backend
//  Admin tek ürün getirme servisi

import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  productTranslations,
  products,
} from "../../../../../shared/infrastructure/database/schema";
import type { SupportedLanguage } from "./product.types";
import { SUPPORTED_LANGUAGES } from "./product.types";
import type { ProductBadges, NutritionalValues } from "../../../../../shared/types/product";

interface AdminProductDetail {
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

export class AdminGetProductService {
  static async execute(productId: string): Promise<{
    success: boolean;
    product?: AdminProductDetail;
    message?: string;
  }> {
    const [productRow] = await db
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
      .where(eq(products.id, productId))
      .limit(1);

    if (!productRow) {
      return {
        success: false,
        message: "Ürün bulunamadı",
      };
    }

    const translationRows = await db
      .select({
        languageCode: productTranslations.languageCode,
        name: productTranslations.name,
        fullName: productTranslations.fullName,
        description: productTranslations.description,
      })
      .from(productTranslations)
      .where(eq(productTranslations.productId, productId));

    const translations = SUPPORTED_LANGUAGES.reduce((acc, lang) => {
      acc[lang] = {
        name: "",
        fullName: null,
        description: null,
      };
      return acc;
    }, {} as AdminProductDetail["translations"]);

    translationRows.forEach((translation) => {
      const lang = translation.languageCode as SupportedLanguage;
      if (!SUPPORTED_LANGUAGES.includes(lang)) {
        return;
      }

      translations[lang] = {
        name: translation.name ?? "",
        fullName: translation.fullName ?? null,
        description: translation.description ?? null,
      };
    });

    const product: AdminProductDetail = {
      productId: productRow.productId,
      productCode: productRow.productCode,
      categoryId: productRow.categoryId,
      brand: productRow.brand,
      size: productRow.size,
      imageUrl: productRow.imageUrl,
      price: toNumber(productRow.price),
      currency: productRow.currency,
      stock: toInt(productRow.stock),
      tax: toNumber(productRow.tax),
      individualPrice: toNumber(productRow.individualPrice),
      corporatePrice: toNumber(productRow.corporatePrice),
      minQuantityIndividual: toInt(productRow.minQuantityIndividual, 1),
      minQuantityCorporate: toInt(productRow.minQuantityCorporate, 1),
      quantityPerBox: productRow.quantityPerBox ? toInt(productRow.quantityPerBox) : null,
      netQuantity: productRow.netQuantity,
      expiryDate: productRow.expiryDate ? productRow.expiryDate.toISOString() : null,
      storageConditions: productRow.storageConditions,
      manufacturerInfo: parseJsonObject(productRow.manufacturerInfo),
      nutritionalValues: parseNutritionalValues(productRow.nutritionalValues),
      originCountry: productRow.originCountry,
      allergens: parseJsonArray(productRow.allergens),
      badges: parseBadges(productRow.badges),
      translations,
      createdAt: productRow.createdAt.toISOString(),
      updatedAt: productRow.updatedAt.toISOString(),
    };

    return {
      success: true,
      product,
    };
  }
}
