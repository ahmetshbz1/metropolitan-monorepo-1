//  "TabBarBackground.ios.tsx"
//  metropolitan app
//  Created by Ahmet on 12.06.2025.

import { useColorScheme } from "@/hooks/useColorScheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

export default function BlurTabBarBackground() {
  const colorScheme = useColorScheme();

  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={80}
      style={StyleSheet.absoluteFill}
      key={colorScheme} // Force re-render on theme change
    />
  );
}

export function useBottomTabOverflow() {
  try {
    return useBottomTabBarHeight();
  } catch {
    // Return 0 if not inside a tab navigator
    return 0;
  }
}
