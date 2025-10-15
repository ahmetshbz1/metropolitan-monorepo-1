import { escapeHtml, sanitizeSqlInput } from '@metropolitan/shared';

/**
 * Sanitize edilebilir değer tipleri
 */
export type SanitizableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SanitizableValue[]
  | { [key: string]: SanitizableValue };

/**
 * Sanitize all string inputs in an object recursively
 * Bir objedeki tüm string değerleri recursive olarak temizler
 */
export const sanitizeObject = <T extends SanitizableValue>(obj: T): T => {
  if (typeof obj === 'string') {
    return sanitizeSqlInput(escapeHtml(obj.trim())) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj).map(([key, value]) => {
      const sanitizedKey = sanitizeSqlInput(key);
      return [sanitizedKey, sanitizeObject(value) as SanitizableValue];
    });
    return Object.fromEntries(entries) as T;
  }

  return obj;
};
