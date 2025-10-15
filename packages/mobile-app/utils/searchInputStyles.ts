//  "searchInputStyles.ts"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Platform } from "react-native";

export const useSearchInputStyles = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  return {
    colors,
    isDark,
    textInputStyle: {
      color: colors.text,
      ...(Platform.OS === "ios" && { paddingVertical: 4 }),
    },
  };
};

export const SEARCH_INPUT_CONFIG = {
  sizes: {
    searchIcon: 24,
    searchIconSmall: 18,
    closeIcon: 22,
    clearIcon: 18,
    height: 48,
  },
  spacing: {
    buttonPadding: 8,
    containerPadding: 14,
    iconMargin: 8,
    clearMargin: 6,
    clearPadding: 2,
    containerMargin: 10,
  },
  animation: {
    duration: 250,
    screenOffset: 100, // Cancel button ve margin için
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  border: {
    radius: 12,
  },
} as const;
