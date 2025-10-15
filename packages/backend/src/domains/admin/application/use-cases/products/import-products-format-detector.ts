/**
 * Import Products Format Detector
 * Dosya formatı tespiti
 */

import type { ImportFormat } from "./import-products-types";

/**
 * Dosya adı ve MIME type'ına göre formatı tespit eder
 * @throws {Error} Desteklenmeyen format durumunda
 */
export const detectFormat = (fileName: string | undefined, mimeType: string | undefined): ImportFormat => {
  if (fileName) {
    const lowered = fileName.toLowerCase();
    if (lowered.endsWith(".xlsx")) {
      return "xlsx";
    }
    if (lowered.endsWith(".csv")) {
      return "csv";
    }
  }

  if (mimeType) {
    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return "xlsx";
    }
    if (mimeType === "text/csv" || mimeType === "application/csv") {
      return "csv";
    }
  }

  throw new Error("Desteklenmeyen dosya formatı. CSV veya Excel yükleyin.");
};
