/**
 * Import Products Processor
 * Ana import işleme mantığı
 */

import { inArray } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/connection";
import { products } from "../../../../../shared/infrastructure/database/schema";
import { AdminUpdateProductQuickSettingsService } from "./update-product-quick-settings.service";
import { parseInteger, parseDecimal, pickValue } from "./import-products-normalizers";
import type { ImportSummary, PreparedRow, ColumnIndices } from "./import-products-types";

/**
 * Header satırını parse eder ve kolon indexlerini tespit eder
 * @throws {Error} productCode kolonu bulunamazsa
 */
export const parseHeader = (headerRow: unknown[]): ColumnIndices => {
  const header = headerRow.map((value) => {
    if (value === null || value === undefined) {
      return "";
    }
    return typeof value === "string" ? value.trim() : String(value).trim();
  });

  const columnIndex = new Map<string, number>();
  header.forEach((column, index) => {
    columnIndex.set(column, index);
  });

  if (!columnIndex.has("productCode")) {
    throw new Error("'productCode' kolonu zorunludur");
  }

  return {
    productCodeIndex: columnIndex.get("productCode") as number,
    stockIndex: columnIndex.get("stock"),
    individualPriceIndex: columnIndex.get("individualPrice"),
    corporatePriceIndex: columnIndex.get("corporatePrice"),
    minIndividualIndex: columnIndex.get("minQuantityIndividual"),
    minCorporateIndex: columnIndex.get("minQuantityCorporate"),
    perBoxIndex: columnIndex.get("quantityPerBox"),
  };
};

/**
 * Veri satırlarını işleme için hazırlar
 * Boş satırları tespit eder ve ürün kodlarını toplar
 */
export const prepareRows = (
  rows: string[][],
  header: unknown[],
  productCodeIndex: number
): { preparedRows: PreparedRow[]; productCodes: Set<string> } => {
  const preparedRows: PreparedRow[] = [];
  const productCodes = new Set<string>();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const sourceRow = rows[rowIndex] ?? [];
    const normalizedRow = header.map((_, columnIdx) => {
      const value = sourceRow[columnIdx];
      if (value === null || value === undefined) {
        return "";
      }
      return typeof value === "string" ? value.trim() : String(value).trim();
    });

    const isEmpty = normalizedRow.every((value) => value.length === 0);
    if (!isEmpty) {
      const code = normalizedRow[productCodeIndex]?.trim?.() ?? "";
      if (code.length > 0) {
        productCodes.add(code);
      }
    }

    preparedRows.push({
      rowNumber: rowIndex + 1,
      values: normalizedRow,
      isEmpty,
    });
  }

  return { preparedRows, productCodes };
};

/**
 * Ürün kodlarına göre veritabanından ürünleri getirir ve map'e dönüştürür
 */
export const loadProductMap = async (productCodes: Set<string>): Promise<Map<string, string>> => {
  if (productCodes.size === 0) {
    return new Map();
  }

  const productRecords = await db
    .select({ id: products.id, productCode: products.productCode })
    .from(products)
    .where(inArray(products.productCode, Array.from(productCodes)));

  const productMap = new Map<string, string>();
  productRecords.forEach((record) => {
    productMap.set(record.productCode, record.id);
  });

  return productMap;
};

/**
 * Tek bir satırı işler ve ürünü günceller
 */
export const processRow = async (
  rowData: PreparedRow,
  columnIndices: ColumnIndices,
  productMap: Map<string, string>,
  adminUserId: string,
  summary: ImportSummary
): Promise<void> => {
  if (rowData.isEmpty) {
    summary.skipped += 1;
    return;
  }

  summary.processed += 1;

  const productCode = rowData.values[columnIndices.productCodeIndex]?.trim?.() ?? "";

  if (productCode.length === 0) {
    summary.errors.push({ row: rowData.rowNumber, message: "Ürün kodu boş" });
    summary.skipped += 1;
    return;
  }

  const productId = productMap.get(productCode);
  if (!productId) {
    summary.errors.push({ row: rowData.rowNumber, message: `Ürün bulunamadı: ${productCode}` });
    summary.skipped += 1;
    return;
  }

  try {
    const stockValue = pickValue(columnIndices.stockIndex, rowData.values);
    const individualPriceValue = pickValue(columnIndices.individualPriceIndex, rowData.values);
    const corporatePriceValue = pickValue(columnIndices.corporatePriceIndex, rowData.values);
    const minIndividualValue = pickValue(columnIndices.minIndividualIndex, rowData.values);
    const minCorporateValue = pickValue(columnIndices.minCorporateIndex, rowData.values);
    const perBoxValue = pickValue(columnIndices.perBoxIndex, rowData.values);

    const payload: Parameters<typeof AdminUpdateProductQuickSettingsService.execute>[0] = {
      productId,
      adminUserId,
    };

    const stock = parseInteger(stockValue);
    if (stock !== undefined) {
      payload.stock = stock;
    }

    const individualPrice = parseDecimal(individualPriceValue);
    if (individualPrice !== undefined) {
      payload.individualPrice = individualPrice;
    }

    const corporatePrice = parseDecimal(corporatePriceValue);
    if (corporatePrice !== undefined) {
      payload.corporatePrice = corporatePrice;
    }

    const minIndividual = parseInteger(minIndividualValue);
    if (minIndividual !== undefined) {
      payload.minQuantityIndividual = minIndividual;
    }

    const minCorporate = parseInteger(minCorporateValue);
    if (minCorporate !== undefined) {
      payload.minQuantityCorporate = minCorporate;
    }

    const perBox = parseInteger(perBoxValue);
    if (perBox !== undefined) {
      payload.quantityPerBox = perBox;
    }

    if (Object.keys(payload).length === 2) {
      summary.skipped += 1;
      return;
    }

    await AdminUpdateProductQuickSettingsService.execute(payload);
    summary.updated += 1;
  } catch (error) {
    summary.errors.push({
      row: rowData.rowNumber,
      message: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
    summary.skipped += 1;
  }
};

/**
 * Tüm satırları işler
 */
export const processAllRows = async (
  rows: string[][],
  adminUserId: string
): Promise<ImportSummary> => {
  if (rows.length === 0) {
    throw new Error("Dosya boş");
  }

  const header = rows[0];
  const columnIndices = parseHeader(header);
  const { preparedRows, productCodes } = prepareRows(rows, header, columnIndices.productCodeIndex);
  const productMap = await loadProductMap(productCodes);

  const summary: ImportSummary = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const rowData of preparedRows) {
    await processRow(rowData, columnIndices, productMap, adminUserId, summary);
  }

  return summary;
};
