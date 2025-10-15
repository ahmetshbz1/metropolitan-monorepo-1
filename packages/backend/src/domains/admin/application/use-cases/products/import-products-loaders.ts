/**
 * Import Products Loaders
 * Dosya yükleme ve okuma işlemleri
 */

import ExcelJS from "exceljs";
import { parseCsv } from "./import-products-parsers";

/**
 * CSV dosyasını okur ve satırlara dönüştürür
 */
export const loadCsvRows = async (file: File): Promise<string[][]> => {
  const content = await file.text();
  return parseCsv(content);
};

/**
 * Excel dosyasını okur ve satırlara dönüştürür
 * İlk worksheet'i kullanır
 * @throws {Error} Worksheet bulunamadığında
 */
export const loadExcelRows = async (file: File): Promise<string[][]> => {
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
