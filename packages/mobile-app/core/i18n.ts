//  "i18n.ts"
//  metropolitan app
//  Created by Ahmet on 02.06.2025.

import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import pl from "@/locales/pl.json";
import tr from "@/locales/tr.json";

export const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
  pl: {
    translation: pl,
  },
} as const;

(i18n as any).use(initReactI18next).init({
  resources,
  lng: Localization.getLocales()[0]?.languageCode,
  fallbackLng: "en",
  compatibilityJSON: "v3", // For react-native
  interpolation: {
    escapeValue: false, // React already safes from xss
  },
});

export default i18n;
