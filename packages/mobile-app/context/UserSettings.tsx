//  "UserSettings.tsx"
//  metropolitan app
//  Created by Ahmet on 10.07.2025.

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// Ayarlar tipi
export type UserSettings = {
  theme: "light" | "dark";
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  notificationSoundsEnabled: boolean;
  // İleriki ayarlar buraya eklenebilir
};

// Context için tip tanımı
type UserSettingsContextType = {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  isLoading: boolean;
};

// Varsayılan ayarlar
const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  hapticsEnabled: true,
  notificationsEnabled: true,
  notificationSoundsEnabled: true,
};

// Context oluştur
export const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  isLoading: true,
});

// Context hook
export const useUserSettings = () => useContext(UserSettingsContext);

// Context Provider bileşeni
export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage'dan ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem("@user_settings");
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error("Ayarlar yüklenirken hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Ayarları güncelle ve kaydet
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(
        "@user_settings",
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error("Ayarlar kaydedilirken hata oluştu:", error);
    }
  };

  return (
    <UserSettingsContext.Provider
      value={{ settings, updateSettings, isLoading }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};
