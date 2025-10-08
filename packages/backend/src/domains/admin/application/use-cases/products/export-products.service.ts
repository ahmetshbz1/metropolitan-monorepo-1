import { and, eq } from "drizzle-orm";

import { buildExportFile, type ExportFormat } from "../../../../../shared/application/services/export/export-builder";
import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  productTranslations,
  products,
} from "../../../../../shared/infrastructure/database/schema";

interface ExportProductsParams {
  format: ExportFormat;
  languageCode?: string;
}

const DEFAULT_LANGUAGE_CODE = "tr";

const formatDecimal = (value: string | number | null): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return numeric.toFixed(2);
};

const formatInteger = (value: number | string | null): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : Math.floor(numeric);
};

export class AdminExportProductsService {
  static async execute({
    format,
    languageCode = DEFAULT_LANGUAGE_CODE,
  }: ExportProductsParams) {
    const rows = await db
      .select({
        productCode: products.productCode,
        productName: productTranslations.name,
        stock: products.stock,
        individualPrice: products.individualPrice,
        corporatePrice: products.corporatePrice,
        minQuantityIndividual: products.minQuantityIndividual,
        minQuantityCorporate: products.minQuantityCorporate,
        quantityPerBox: products.quantityPerBox,
        currency: products.currency,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.languageCode, languageCode)
        )
      )
      .orderBy(products.productCode);

    const exportRows = rows.map((row) => ({
      productCode: row.productCode,
      productName: row.productName ?? row.productCode,
      stock: formatInteger(row.stock),
      individualPrice: formatDecimal(row.individualPrice),
      corporatePrice: formatDecimal(row.corporatePrice),
      minQuantityIndividual: formatInteger(row.minQuantityIndividual),
      minQuantityCorporate: formatInteger(row.minQuantityCorporate),
      quantityPerBox: row.quantityPerBox ? formatInteger(row.quantityPerBox) : "",
      currency: row.currency,
      updatedAt: row.updatedAt.toISOString(),
    }));

    const exportFile = await buildExportFile({
      sheetName: "Products",
      columns: [
        { header: "Ürün Kodu", key: "productCode", width: 18 },
        { header: "Ürün Adı", key: "productName", width: 40 },
        { header: "Stok", key: "stock", width: 12 },
        { header: "Bireysel Fiyat", key: "individualPrice", width: 16 },
        { header: "Kurumsal Fiyat", key: "corporatePrice", width: 16 },
        { header: "Min. Bireysel", key: "minQuantityIndividual", width: 16 },
        { header: "Min. Kurumsal", key: "minQuantityCorporate", width: 16 },
        { header: "Koli Adedi", key: "quantityPerBox", width: 14 },
        { header: "Para Birimi", key: "currency", width: 14 },
        { header: "Güncellendi", key: "updatedAt", width: 24 },
      ],
      rows: exportRows,
      format,
    });

    return exportFile;
  }
}
