//  "layoutStyles.ts"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import type { ThemeColors } from "@/types/theme";

export const LAYOUT_CONSTANTS = {
  headerHeight: {
    ios: 44,
    android: 56,
  },
  statusBarHeight: {
    ios: 20,
    android: 24,
  },
  tabBarHeight: {
    ios: 49,
    android: 56,
  },
} as const;

export const createLayoutStyles = (colors: ThemeColors) => {
  return {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerStyle: {
      backgroundColor: colors.background,
      borderBottomWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTitleStyle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "600" as const,
    },
    statusBarStyle: {
      backgroundColor: colors.background,
    },
    safeAreaStyle: {
      backgroundColor: colors.background,
    },
  };
};

export const LAYOUT_ANIMATIONS = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 300,
  },
  slideUp: {
    from: { transform: [{ translateY: 50 }] },
    to: { transform: [{ translateY: 0 }] },
    duration: 300,
  },
  scaleIn: {
    from: { transform: [{ scale: 0.9 }] },
    to: { transform: [{ scale: 1 }] },
    duration: 200,
  },
} as const;
