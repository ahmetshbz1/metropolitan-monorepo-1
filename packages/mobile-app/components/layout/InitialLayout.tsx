//  "InitialLayout.tsx"
//  metropolitan app
//  Created by Ahmet on 11.06.2025. Updated on 21.07.2025.

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";

import { NavigationStack } from "./NavigationStack";

export const InitialLayout: React.FC = () => {
  const [loaded, error] = useFonts({
    // ... add your fonts here
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Font yüklenmemiş ise null döndür (Expo splash screen görünür)
  if (!loaded) {
    return null;
  }

  return <NavigationStack />;
};
