//  "searchInputStyles.ts"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Platform } from "react-native";

export const useSearchInputStyles = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return {
    colors,
    textInputStyle: {
      color: colors.text,
      ...(Platform.OS === "ios" && { paddingVertical: 4 }),
    },
    shadowStyle: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
  };
};

export const SEARCH_INPUT_CONFIG = {
  sizes: {
    searchIcon: 24,
    searchIconSmall: 16,
    closeIcon: 20,
    clearIcon: 16,
  },
  spacing: {
    buttonPadding: 8,
    containerPadding: 12,
    verticalPadding: 8,
    iconMargin: 8,
    clearMargin: 4,
    clearPadding: 2,
    containerMargin: 8,
  },
  animation: {
    duration: 300,
    screenOffset: 100, // Cancel button ve margin için
  },
  text: {
    fontSize: 16,
    lineHeight: 18,
  },
  border: {
    radius: 12,
  },
} as const;
