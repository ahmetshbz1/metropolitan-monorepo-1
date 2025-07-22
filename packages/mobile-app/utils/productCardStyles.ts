//  "productCardStyles.ts"
//  metropolitan app
//  Created by Ahmet on 08.06.2025.

import { ColorSchemeName } from "react-native";

export const getGradientColors = (
  colorScheme: ColorSchemeName,
  isOutOfStock: boolean,
  isLowStock: boolean
): [string, string] => {
  if (colorScheme === "dark") {
    if (isOutOfStock)
      return ["rgba(244, 67, 54, 0.1)", "rgba(244, 67, 54, 0.05)"];
    if (isLowStock)
      return ["rgba(255, 152, 0, 0.1)", "rgba(255, 152, 0, 0.05)"];
    return ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"];
  } else {
    if (isOutOfStock)
      return ["rgba(244, 67, 54, 0.08)", "rgba(244, 67, 54, 0.03)"];
    if (isLowStock)
      return ["rgba(255, 152, 0, 0.08)", "rgba(255, 152, 0, 0.03)"];
    return ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.6)"];
  }
};

export const getCardShadowStyle = (colorScheme: ColorSchemeName) => ({
  shadowColor: colorScheme === "dark" ? "#000" : "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
  shadowRadius: 20,
  elevation: 8,
});

export const getBackdropStyle = (colorScheme: ColorSchemeName) => ({
  backgroundColor:
    colorScheme === "dark"
      ? "rgba(30, 30, 30, 0.8)"
      : "rgba(255, 255, 255, 0.85)",
});

export const getImageBackgroundStyle = (colorScheme: ColorSchemeName) => ({
  backgroundColor:
    colorScheme === "dark"
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(248, 250, 252, 0.8)",
  borderWidth: 1,
  borderColor:
    colorScheme === "dark"
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(228, 232, 237, 0.6)",
});

export const getImageGlowStyle = (colorScheme: ColorSchemeName) => ({
  backgroundColor:
    colorScheme === "dark"
      ? "rgba(255, 255, 255, 0.02)"
      : "rgba(255, 255, 255, 0.9)",
});

export const getCategoryBadgeStyle = (colorScheme: ColorSchemeName) => ({
  backgroundColor:
    colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
});
