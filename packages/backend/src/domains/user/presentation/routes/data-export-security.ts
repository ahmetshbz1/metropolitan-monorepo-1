// "data-export-security.ts"
// metropolitan backend
// Security validation for file access

import * as fs from "fs";
import * as path from "path";

interface FileOwnershipResult {
  isValid: boolean;
  reason?: string;
}

interface FileValidationResult {
  isValid: boolean;
  filePath?: string;
  reason?: string;
}

/**
 * Dosya isminin authenticated user'a ait olduğunu doğrula
 * SECURITY: Kullanıcı sadece kendi dosyalarına erişebilir
 */
export function validateFileOwnership(
  fileName: string,
  userId: string
): FileOwnershipResult {
  if (!fileName.includes(userId)) {
    return {
      isValid: false,
      reason: "File does not belong to user",
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Dosya yolunu oluştur ve varlığını kontrol et
 * Exports klasöründeki dosya için tam path oluşturur
 */
export function validateFileExists(fileName: string): FileValidationResult {
  const filePath = path.join(process.cwd(), "uploads", "exports", fileName);

  if (!fs.existsSync(filePath)) {
    return {
      isValid: false,
      reason: "File not found",
    };
  }

  return {
    isValid: true,
    filePath,
  };
}

/**
 * Token ve fileName parametrelerinin varlığını kontrol et
 */
export function validateRequestParams(
  token: string | undefined,
  fileName: string | undefined
): boolean {
  return Boolean(token && fileName);
}

/**
 * View export için tüm parametreleri kontrol et
 */
export function validateViewExportParams(
  token: string | undefined,
  fileName: string | undefined,
  password: string | undefined
): boolean {
  return Boolean(token && fileName && password);
}
