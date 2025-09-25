//  "ColorSchemeContext.tsx"
//  metropolitan app
//  Created by Ahmet on 24.07.2025.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ColorSchemeName, useColorScheme as useSystemColorScheme } from "react-native";
import { useUserSettings } from "./UserSettings";

type ColorSchemeContextType = {
  colorScheme: ColorSchemeName;
  isDark: boolean;
  setColorScheme: (scheme: ColorSchemeName) => void;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  currentThemeSetting: "light" | "dark" | "system";
};

export const ColorSchemeContext = createContext<
  ColorSchemeContextType | undefined
>(undefined);

export const ColorSchemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { settings, isLoading, updateSettings } = useUserSettings();
  const systemColorScheme = useSystemColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>("light");

  useEffect(() => {
    // UserSettings yüklendikten sonra tema değerini ayarla
    if (!isLoading) {
      if (settings.theme === "system") {
        setColorScheme(systemColorScheme || "light");
      } else {
        setColorScheme(settings.theme);
      }
    }
  }, [settings.theme, isLoading, systemColorScheme]);

  const isDark = colorScheme === "dark";

  // Tema değiştirme fonksiyonu - optimistik güncelleme yapar
  const toggleTheme = () => {
    const newTheme = colorScheme === "light" ? "dark" : "light";
    setColorScheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  // Yeni setTheme fonksiyonu
  const setTheme = (theme: "light" | "dark" | "system") => {
    if (theme === "system") {
      setColorScheme(systemColorScheme || "light");
    } else {
      setColorScheme(theme);
    }
    updateSettings({ theme });
  };

  const contextValue = useMemo(
    () => ({
      colorScheme,
      isDark,
      setColorScheme,
      toggleTheme,
      setTheme,
      currentThemeSetting: settings.theme
    }),
    [colorScheme, isDark, toggleTheme, setTheme, settings.theme]
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
