/**
 * Import Products Service
 * Ürün import işlemleri için facade service
 */

import { detectFormat } from "./import-products-format-detector";
import { loadCsvRows, loadExcelRows } from "./import-products-loaders";
import { processAllRows } from "./import-products-processor";
import type { ImportSummary } from "./import-products-types";

export class AdminImportProductsService {
  private static readonly IMPORT_LOCK_KEY = "metropolitan:import:global-lock";
  private static readonly IMPORT_LOCK_TIMEOUT_MS = 300000; // 5 minutes

  static async execute(file: File, adminUserId: string): Promise<ImportSummary> {
    const { redis } = await import("../../../../../shared/infrastructure/database/redis");

    // Acquire global import lock
    const lockAcquired = await redis.set(
      this.IMPORT_LOCK_KEY,
      adminUserId,
      "PX",
      this.IMPORT_LOCK_TIMEOUT_MS,
      "NX"
    );

    if (!lockAcquired) {
      throw new Error("Başka bir import işlemi devam ediyor. Lütfen bekleyin.");
    }

    try {
      const format = detectFormat(file.name, file.type);
      const rows = format === "xlsx" ? await loadExcelRows(file) : await loadCsvRows(file);
      return await processAllRows(rows, adminUserId);
    } finally {
      // Release global import lock
      await redis.del(this.IMPORT_LOCK_KEY);
      const { logger } = await import("../../../../../shared/infrastructure/monitoring/logger.config");
      logger.info({ context: "AdminImportProductsService" }, "Import lock released");
    }
  }
}
