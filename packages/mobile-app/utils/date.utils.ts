//  "date.utils.ts"
//  metropolitan app
//  Created by Ahmet on 21.07.2025.

import { format } from "date-fns/format";
import { enUS } from "date-fns/locale/en-US";
import { pl } from "date-fns/locale/pl";
import { tr } from "date-fns/locale/tr";

/**
 * date-fns için locale mapping
 */
const localeMap = {
  en: enUS,
  tr: tr,
  pl: pl,
} as const;

/**
 * Mevcut dil için date-fns locale'ı döndürür
 * @param language i18n dil kodu (en, tr, pl)
 */
function getLocale(language: string) {
  return localeMap[language as keyof typeof localeMap] || enUS;
}

/**
 * i18n diliyle uyumlu tarih formatlaması
 * @param date Formatlanacak tarih
 * @param formatString date-fns format string'i
 * @param language i18n dil kodu
 */
export function formatDate(
  date: Date | string,
  formatString: string,
  language: string
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const locale = getLocale(language);
  
  return format(dateObj, formatString, { locale });
}

/**
 * Yaygın tarih formatları için kısayollar
 */
export const DateFormats = {
  // 21 Temmuz 2025, 14:30
  FULL_WITH_TIME: "dd MMMM yyyy, HH:mm",
  
  // 21 Temmuz 2025
  FULL_DATE: "dd MMMM yyyy",
  
  // 21 Tem 2025 - 14:30
  SHORT_WITH_TIME: "dd MMM yyyy - HH:mm",
  
  // 21 Tem 2025
  SHORT_DATE: "dd MMM yyyy",
} as const;