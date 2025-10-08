import ExcelJS from "exceljs";
import { eq, inArray } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { products } from "../../../../../shared/infrastructure/database/schema";
import { AdminUpdateProductQuickSettingsService } from "./update-product-quick-settings.service";

type ImportFormat = "csv" | "xlsx";

interface ImportSummary {
  processed: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

const parseCsv = (content: string): string[][] => {
  const rows: string[][] = [];
  let current = "";
  let insideQuotes = false;
  const currentRow: string[] = [];

  const pushValue = () => {
    currentRow.push(current);
    current = "";
  };

  const pushRow = () => {
    pushValue();
    rows.push([...currentRow]);
    currentRow.length = 0;
  };

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (char === "\"") {
      if (insideQuotes && content[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      pushValue();
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && content[i + 1] === "\n") {
        i += 1;
      }
      pushRow();
      continue;
    }

    current += char;
  }

  if (insideQuotes) {
    throw new Error("CSV dosyası hatalı: tırnaklar uyumsuz");
  }

  if (current.length > 0 || currentRow.length > 0) {
    pushRow();
  }

  return rows;
};

const detectFormat = (fileName: string | undefined, mimeType: string | undefined): ImportFormat => {
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

const normalizeNumber = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.replace(/,/g, ".");
};

const parseInteger = (value: string | undefined): number | undefined => {
  const normalized = normalizeNumber(value);
  if (normalized === undefined) {
    return undefined;
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("Geçersiz tam sayı değeri");
  }

  return Math.floor(numeric);
};

const parseDecimal = (value: string | undefined): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const normalized = trimmed.replace(/,/g, ".");
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("Geçersiz fiyat değeri");
  }

  return numeric;
};

const loadCsvRows = async (file: File): Promise<string[][]> => {
  const content = await file.text();
  return parseCsv(content);
};

const loadExcelRows = async (file: File): Promise<string[][]> => {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Excel dosyasında sayfa bulunamadı");
  }

  const rows: string[][] = [];

  worksheet.eachRow((row) => {
    const values = row.values
      .slice(1)
      .map((cell) => (cell === null || cell === undefined ? "" : String(cell)));
    rows.push(values);
  });

  return rows;
};

export class AdminImportProductsService {
  static async execute(file: File): Promise<ImportSummary> {
    const format = detectFormat(file.name, file.type);
    const rows = format === "xlsx" ? await loadExcelRows(file) : await loadCsvRows(file);

    if (rows.length === 0) {
      throw new Error("Dosya boş");
    }

    const header = rows[0].map((value) => {
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

    const productCodeIndex = columnIndex.get("productCode") as number;
    const stockIndex = columnIndex.get("stock");
    const individualPriceIndex = columnIndex.get("individualPrice");
    const corporatePriceIndex = columnIndex.get("corporatePrice");
    const minIndividualIndex = columnIndex.get("minQuantityIndividual");
    const minCorporateIndex = columnIndex.get("minQuantityCorporate");
    const perBoxIndex = columnIndex.get("quantityPerBox");

    const preparedRows: Array<{ rowNumber: number; values: string[]; isEmpty: boolean }> = [];
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

    const productRecords =
      productCodes.size === 0
        ? []
        : await db
            .select({ id: products.id, productCode: products.productCode })
            .from(products)
            .where(inArray(products.productCode, Array.from(productCodes)));

    const productMap = new Map<string, string>();
    productRecords.forEach((record) => {
      productMap.set(record.productCode, record.id);
    });

    const summary: ImportSummary = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    const pickValue = (index: number | undefined, row: string[]): string | undefined =>
      index === undefined ? undefined : row[index];

    for (const rowData of preparedRows) {
      if (rowData.isEmpty) {
        summary.skipped += 1;
        continue;
      }

      summary.processed += 1;

      const productCode = rowData.values[productCodeIndex]?.trim?.() ?? "";

      if (productCode.length === 0) {
        summary.errors.push({ row: rowData.rowNumber, message: "Ürün kodu boş" });
        summary.skipped += 1;
        continue;
      }

      const productId = productMap.get(productCode);
      if (!productId) {
        summary.errors.push({ row: rowData.rowNumber, message: `Ürün bulunamadı: ${productCode}` });
        summary.skipped += 1;
        continue;
      }

      try {
        const stockValue = pickValue(stockIndex, rowData.values);
        const individualPriceValue = pickValue(individualPriceIndex, rowData.values);
        const corporatePriceValue = pickValue(corporatePriceIndex, rowData.values);
        const minIndividualValue = pickValue(minIndividualIndex, rowData.values);
        const minCorporateValue = pickValue(minCorporateIndex, rowData.values);
        const perBoxValue = pickValue(perBoxIndex, rowData.values);

        const payload: Parameters<typeof AdminUpdateProductQuickSettingsService.execute>[0] = {
          productId,
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

        if (Object.keys(payload).length === 1) {
          summary.skipped += 1;
          continue;
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
    }

    return summary;
  }
}
