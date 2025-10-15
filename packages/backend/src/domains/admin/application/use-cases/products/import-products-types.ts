/**
 * Import Products Types
 * Ürün import işlemleri için tip tanımlamaları
 */

export type ImportFormat = "csv" | "xlsx";

export interface ImportSummary {
  processed: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

export interface PreparedRow {
  rowNumber: number;
  values: string[];
  isEmpty: boolean;
}

export interface ColumnIndices {
  productCodeIndex: number;
  stockIndex: number | undefined;
  individualPriceIndex: number | undefined;
  corporatePriceIndex: number | undefined;
  minIndividualIndex: number | undefined;
  minCorporateIndex: number | undefined;
  perBoxIndex: number | undefined;
}
