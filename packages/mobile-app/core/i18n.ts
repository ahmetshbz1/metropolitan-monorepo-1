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
  } catch {
    // Storage okuma hatası - sistem dili kullanılacak
  }

  return getSystemLanguage();
};

// i18n'i senkron başlat - AsyncStorage kontrolü sonradan yapılacak
i18n.use(initReactI18next).init({
  resources,
  lng: getSystemLanguage(), // İlk başta sistem dilini kullan
  fallbackLng: "tr",
  compatibilityJSON: "v4", // For react-native
  interpolation: {
    escapeValue: false, // React already safes from xss
  },
});

// AsyncStorage'dan dili yükle ve güncelle
const initializeLanguage = async () => {
  const savedLanguage = await loadLanguageFromStorage();
  if (savedLanguage !== i18n.language) {
    await i18n.changeLanguage(savedLanguage);
  }
};

// Uygulama başladıktan sonra dili yükle
initializeLanguage().catch(() => {
  // Dil yükleme hatası - sistem dili kullanılacak
});

// Dil değiştirme fonksiyonu - AsyncStorage'a kaydet
export const changeLanguage = async (language: "tr" | "en" | "pl") => {
  try {
    await AsyncStorage.setItem("@app_language", language);
    await i18n.changeLanguage(language);
  } catch {
    // Dil değiştirme hatası
  }
};

export default i18n;
