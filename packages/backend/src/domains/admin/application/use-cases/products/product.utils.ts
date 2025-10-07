//  "product.utils.ts"
//  metropolitan backend
//  Admin ürün yardımcıları

import type {
  AdminProductTranslationInput,
  SupportedLanguage,
} from "./product.types";
import { SUPPORTED_LANGUAGES } from "./product.types";

export const ensureLanguageCoverage = (
  translations: AdminProductTranslationInput[]
): void => {
  const languageSet = new Set<SupportedLanguage>();

  translations.forEach((translation) => {
    languageSet.add(translation.languageCode);
  });

  const missing = SUPPORTED_LANGUAGES.filter(
    (language) => !languageSet.has(language)
  );

  if (missing.length > 0) {
    throw new Error(
      `Eksik çeviri dilleri: ${missing.join(", ")}. Tüm diller için içerik göndermelisiniz.`
    );
  }
};

export const serializeNullableJson = (
  value: Record<string, unknown> | string[] | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new Error("JSON alanları dönüştürülürken hata oluştu");
  }
};

export const toDecimalString = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (Number.isNaN(value)) {
    throw new Error("Geçersiz sayısal değer alındı");
  }

  return value.toString();
};

export const toDateOrNull = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Geçersiz tarih formatı alındı");
  }

  return date;
};
