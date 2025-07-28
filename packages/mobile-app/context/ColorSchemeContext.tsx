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
import { ColorSchemeName } from "react-native";
import { useUserSettings } from "./UserSettings";

type ColorSchemeContextType = {
  colorScheme: ColorSchemeName;
  isDark: boolean;
  setColorScheme: (scheme: ColorSchemeName) => void;
  toggleTheme: () => void;
};

export const ColorSchemeContext = createContext<
  ColorSchemeContextType | undefined
>(undefined);

export const ColorSchemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { settings, isLoading, updateSettings } = useUserSettings();
  // Başlangıç değerini UserSettings'ten al, yoksa varsayılan light
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>("light");

  useEffect(() => {
    // UserSettings yüklendikten sonra tema değerini ayarla
    if (!isLoading) {
      setColorScheme(settings.theme);
      // Sistem temasını değiştirmiyoruz, sadece uygulama içi tema
    }
  }, [settings.theme, isLoading]);

  const isDark = colorScheme === "dark";

  // Tema değiştirme fonksiyonu - optimistik güncelleme yapar
  const toggleTheme = () => {
    const newTheme = colorScheme === "light" ? "dark" : "light";

    // Anında UI'ı güncelle
    setColorScheme(newTheme);
    // Sistem temasını değiştirmiyoruz

    // Arka planda UserSettings'i güncelle
    updateSettings({ theme: newTheme });
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
