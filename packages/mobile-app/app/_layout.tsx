//  "_layout.tsx"
//  metropolitan app
//  Created by Ahmet on 05.07.2025.

import "@/core/i18n";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import "../global.css";

import { AppProviders } from "@/components/layout/AppProviders";
import { InitialLayout } from "@/components/layout/InitialLayout";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppProviders>
      <InitialLayout />
    </AppProviders>
  );
}
