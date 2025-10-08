import { Buffer } from "node:buffer";

import ExcelJS from "exceljs";

export type ExportFormat = "csv" | "xlsx";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export type ExportRow = Record<string, string | number | null | undefined>;

interface BuildExportOptions {
  sheetName: string;
  columns: ExportColumn[];
  rows: ExportRow[];
  format: ExportFormat;
}

interface ExportResult {
  buffer: Buffer;
  contentType: string;
  fileExtension: "csv" | "xlsx";
}

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CSV_MIME = "text/csv; charset=utf-8";

const toColumnWidth = (column: ExportColumn): number => {
  if (column.width) {
    return column.width;
  }

  const minimum = column.header.length + 4;
  return minimum < 12 ? 12 : minimum;
};

const normalizeBuffer = (value: unknown): Buffer => {
  if (value instanceof Buffer) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer);
  }

  if (typeof value === "string") {
    return Buffer.from(value, "utf8");
  }

  throw new Error("Desteklenmeyen buffer formatı alındı");
};

export const buildExportFile = async ({
  sheetName,
  columns,
  rows,
  format,
}: BuildExportOptions): Promise<ExportResult> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: toColumnWidth(column),
  }));

  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  if (format === "xlsx") {
    const rawBuffer = await workbook.xlsx.writeBuffer();
    return {
      buffer: normalizeBuffer(rawBuffer),
      contentType: EXCEL_MIME,
      fileExtension: "xlsx",
    };
  }

  const csvRaw = await workbook.csv.writeBuffer();
  const csvBuffer = normalizeBuffer(csvRaw);
  const withBom = Buffer.concat([Buffer.from("\uFEFF", "utf8"), csvBuffer]);

  return {
    buffer: withBom,
    contentType: CSV_MIME,
    fileExtension: "csv",
  };
};
