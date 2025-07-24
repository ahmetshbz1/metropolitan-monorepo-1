//  "ColorSchemeContext.tsx"
//  metropolitan app
//  Created by Ahmet on 24.07.2025.

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { useUserSettings } from "./UserSettings";

type ColorSchemeContextType = {
  colorScheme: ColorSchemeName;
  isDark: boolean;
  setColorScheme: (scheme: ColorSchemeName) => void;
  toggleTheme: () => void;
};

export const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(
  undefined
);

export const ColorSchemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { settings, isLoading, updateSettings } = useUserSettings();
  // Başlangıç değerini UserSettings'ten al
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    isLoading ? "light" : settings.theme
  );

  useEffect(() => {
    // UserSettings yüklendikten sonra tema değerini ayarla
    if (!isLoading && settings.theme !== colorScheme) {
      setColorScheme(settings.theme);
      
      // React Native'in Appearance API'sini güncelle
      Appearance.setColorScheme(settings.theme);
    }
  }, [settings.theme, isLoading]);

  const isDark = colorScheme === "dark";

  // Tema değiştirme fonksiyonu - anında güncelleme yapar
  const toggleTheme = () => {
    const newTheme = colorScheme === "light" ? "dark" : "light";
    
    // Local state'i anında güncelle
    setColorScheme(newTheme);
    
    // Appearance API'yi anında güncelle
    Appearance.setColorScheme(newTheme);
    
    // UI güncellemesini hızlandır
    requestAnimationFrame(() => {
      // UserSettings'i güncelle
      updateSettings({ theme: newTheme });
    });
  };

  const contextValue = useMemo(
    () => ({ colorScheme, isDark, setColorScheme, toggleTheme }),
    [colorScheme, isDark, toggleTheme]
  );

  return (
    <ColorSchemeContext.Provider value={contextValue}>
      {children}
    </ColorSchemeContext.Provider>
  );
};

export const useAppColorScheme = () => {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error(
      "useAppColorScheme must be used within a ColorSchemeProvider"
    );
  }
  return context;
};