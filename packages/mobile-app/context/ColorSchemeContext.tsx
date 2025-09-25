//  "ColorSchemeContext.tsx"
//  metropolitan app
//  Created by Ahmet on 24.07.2025.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { ColorSchemeName, useColorScheme as useSystemColorScheme, InteractionManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [themeSetting, setThemeSetting] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    // UserSettings yüklendikten sonra başlangıç tema değerini ayarla
    if (!isLoading) {
      setThemeSetting(settings.theme);
      if (settings.theme === "system") {
        setColorScheme(systemColorScheme || "light");
      } else {
        setColorScheme(settings.theme);
      }
    }
  }, [settings.theme, isLoading, systemColorScheme]);

  const isDark = colorScheme === "dark";

  // Persist theme without blocking UI thread
  const persistTheme = useCallback(
    async (theme: "light" | "dark" | "system") => {
      // Persist only to storage to avoid triggering global UserSettings re-render
      // Do it after interactions to keep UI smooth
      InteractionManager.runAfterInteractions(async () => {
        try {
          const raw = await AsyncStorage.getItem("@user_settings");
          const json = raw ? JSON.parse(raw) : {};
          const next = { ...json, theme };
          await AsyncStorage.setItem("@user_settings", JSON.stringify(next));
        } catch (e) {
          // swallow persistence errors
        }
      });
    },
    []
  );

  // Tema değiştirme fonksiyonu - optimistik güncelleme + arka planda persist
  const toggleTheme = useCallback(() => {
    const newTheme = colorScheme === "light" ? "dark" : "light";
    setThemeSetting(newTheme);
    setColorScheme(newTheme);
    persistTheme(newTheme);
  }, [colorScheme, persistTheme]);

  // Yeni setTheme fonksiyonu - optimistik güncelleme + arka planda persist
  const setTheme = useCallback(
    (theme: "light" | "dark" | "system") => {
      setThemeSetting(theme);
      if (theme === "system") {
        setColorScheme(systemColorScheme || "light");
      } else {
        setColorScheme(theme);
      }
      persistTheme(theme);
    },
    [systemColorScheme, persistTheme]
  );

  const contextValue = useMemo(
    () => ({
      colorScheme,
      isDark,
      setColorScheme,
      toggleTheme,
      setTheme,
      currentThemeSetting: themeSetting,
    }),
    [colorScheme, isDark, themeSetting, toggleTheme, setTheme]
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
