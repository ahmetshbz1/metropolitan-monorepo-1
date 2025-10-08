import { and, asc, eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  productTranslations,
  products,
} from "../../../../../shared/infrastructure/database/schema";

import type { SupportedLanguage } from "./product.types";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const DATASET_LIMIT = 1000;

export type StockAlertLevel = "critical" | "warning";

export interface StockAlertFilters {
  limit?: number;
  level?: StockAlertLevel;
  search?: string | null;
}

export interface StockAlertItem {
  productId: string;
  productCode: string;
  productName: string;
  stock: number;
  individualPrice: string | null;
  corporatePrice: string | null;
  threshold: number;
  deficit: number;
  restockSuggestion: number;
  minQuantityIndividual: number;
  minQuantityCorporate: number;
  quantityPerBox: number | null;
  level: StockAlertLevel;
  updatedAt: string;
}

export interface StockAlertSummary {
  critical: number;
  warning: number;
  total: number;
}

export interface StockAlertsResponse {
  success: true;
  items: StockAlertItem[];
  total: number;
  limit: number;
  summary: StockAlertSummary;
}

const toInt = (
  value: number | string | null | undefined,
  fallback = 0
): number => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? fallback : numeric;
};

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? "";

const SUPPORTED_SEARCH_LANG: SupportedLanguage = "tr";

export class AdminGetStockAlertsService {
  static async execute(
    filters: StockAlertFilters = {}
  ): Promise<StockAlertsResponse> {
    const safeLimit = Math.min(
      Math.max(filters.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const normalizedSearch = normalizeText(filters.search);

    const rows = await db
      .select({
        productId: products.id,
        productCode: products.productCode,
        productName: productTranslations.name,
        stock: products.stock,
        individualPrice: products.individualPrice,
        corporatePrice: products.corporatePrice,
        minQuantityIndividual: products.minQuantityIndividual,
        minQuantityCorporate: products.minQuantityCorporate,
        quantityPerBox: products.quantityPerBox,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.languageCode, SUPPORTED_SEARCH_LANG)
        )
      )
      .orderBy(asc(products.stock))
      .limit(DATASET_LIMIT);

    const alerts: StockAlertItem[] = [];
    let criticalCount = 0;
    let warningCount = 0;

    for (const row of rows) {
      const stock = toInt(row.stock, 0);
      const minIndividual = Math.max(toInt(row.minQuantityIndividual, 1), 0);
      const minCorporate = Math.max(toInt(row.minQuantityCorporate, 1), 0);
      const perBox = Math.max(toInt(row.quantityPerBox, 0), 0);

      const baselineThreshold = Math.max(
        minIndividual,
        minCorporate,
        perBox,
        5
      );

      const level: StockAlertLevel | null =
        stock <= 0 ? "critical" : stock <= baselineThreshold ? "warning" : null;

      if (!level) {
        continue;
      }

      if (level === "critical") {
        criticalCount += 1;
      } else {
        warningCount += 1;
      }

      if (filters.level && filters.level !== level) {
        continue;
      }

      const deficit = Math.max(
        baselineThreshold - stock,
        level === "critical" ? baselineThreshold : 0
      );
      const restockTarget = Math.max(
        baselineThreshold * 2,
        stock + baselineThreshold,
        stock + perBox
      );
      const restockSuggestion = Math.max(
        restockTarget - stock,
        baselineThreshold
      );

      const productName = row.productName ?? row.productCode;

      if (normalizedSearch) {
        const matchesSearch =
          productName.toLowerCase().includes(normalizedSearch) ||
          row.productCode.toLowerCase().includes(normalizedSearch);

        if (!matchesSearch) {
          continue;
        }
      }

      alerts.push({
        productId: row.productId,
        productCode: row.productCode,
        productName,
        stock,
        individualPrice: row.individualPrice ?? null,
        corporatePrice: row.corporatePrice ?? null,
        threshold: baselineThreshold,
        deficit,
        restockSuggestion,
        minQuantityIndividual: minIndividual,
        minQuantityCorporate: minCorporate,
        quantityPerBox: perBox > 0 ? perBox : null,
        level,
        updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
      });
    }

    const summary: StockAlertSummary = {
      critical: criticalCount,
      warning: warningCount,
      total: criticalCount + warningCount,
    };

    return {
      success: true,
      items: alerts.slice(0, safeLimit),
      total: alerts.length,
      limit: safeLimit,
      summary,
    };
  }
}
