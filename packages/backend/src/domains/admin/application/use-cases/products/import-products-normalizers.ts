/**
 * Import Products Normalizers
 * Veri normalizasyon ve parsing yardımcı fonksiyonları
 */

/**
 * Sayısal değeri normalize eder (virgül -> nokta dönüşümü)
 */
export const normalizeNumber = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.replace(/,/g, ".");
};

/**
 * String değeri tam sayıya dönüştürür
 * @throws {Error} Geçersiz değer durumunda
 */
export const parseInteger = (value: string | undefined): number | undefined => {
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

/**
 * String değeri ondalık sayıya dönüştürür
 * Boş string null döner, undefined ise undefined döner
 * @throws {Error} Geçersiz değer durumunda
 */
export const parseDecimal = (value: string | undefined): number | null | undefined => {
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

/**
 * Belirtilen index'teki değeri güvenli şekilde alır
 */
export const pickValue = (index: number | undefined, row: string[]): string | undefined =>
  index === undefined ? undefined : row[index];
