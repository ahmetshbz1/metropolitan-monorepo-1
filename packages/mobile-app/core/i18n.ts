//  "i18n.ts"
//  metropolitan app
//  Created by Ahmet on 02.06.2025.

import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Sistem dilini al
const getSystemLanguage = (): string => {
  const systemLanguage = Localization.getLocales()[0]?.languageCode;
  return systemLanguage && ["tr", "en", "pl"].includes(systemLanguage)
    ? systemLanguage
    : "tr"; // Varsayılan olarak Türkçe
};

// Dil ayarını AsyncStorage'dan yükle
const loadLanguageFromStorage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem("@app_language");
    if (savedLanguage && ["tr", "en", "pl"].includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.error("Dil ayarı yüklenirken hata:", error);
  }

  return getSystemLanguage();
};

// i18n'i başlat
const initializeI18n = async () => {
  const savedLanguage = await loadLanguageFromStorage();

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: "tr",
    compatibilityJSON: "v3", // For react-native
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });
};

// Dil değiştirme fonksiyonu - AsyncStorage'a kaydet
export const changeLanguage = async (language: "tr" | "en" | "pl") => {
  try {
    await AsyncStorage.setItem("@app_language", language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error("Dil değiştirilirken hata:", error);
  }
};

// i18n'i başlat
initializeI18n();

export default i18n;
