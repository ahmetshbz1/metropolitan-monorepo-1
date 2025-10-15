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
    textInputStyle: {
      color: colors.text,
      ...(Platform.OS === "ios" && { paddingVertical: 4 }),
    },
    shadowStyle: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  };
};

export const SEARCH_INPUT_CONFIG = {
  sizes: {
    searchIcon: 24,
    searchIconSmall: 18,
    closeIcon: 22,
    clearIcon: 18,
  },
  spacing: {
    buttonPadding: 8,
    containerPadding: 14,
    verticalPadding: 10,
    iconMargin: 10,
    clearMargin: 6,
    clearPadding: 2,
    containerMargin: 10,
  },
  animation: {
    duration: 250,
    screenOffset: 100, // Cancel button ve margin için
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  border: {
    radius: 16,
  },
} as const;
