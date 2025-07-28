//  "buttonStyles.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { ViewStyle, TextStyle } from "react-native";
import type { ThemeColors, ColorScheme } from "@/types/theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost"
  | "text";

export type ButtonSize = {
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  minHeight: number;
};

// Variant configurations
export const getVariantStyle = (variant: ButtonVariant, isDisabled: boolean, colors: ThemeColors) => {
  switch (variant) {
    case "primary":
      return {
        backgroundColor: isDisabled ? colors.mutedForeground : colors.primary,
        borderWidth: 0,
      };
    case "secondary":
      return {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: isDisabled ? colors.mutedForeground : colors.primary,
      };
    case "danger":
      return {
        backgroundColor: isDisabled ? colors.mutedForeground : colors.error,
        borderWidth: 0,
      };
    case "success":
      return {
        backgroundColor: isDisabled ? colors.mutedForeground : colors.success,
        borderWidth: 0,
      };
    case "ghost":
      return {
        backgroundColor: isDisabled
          ? colors.mutedForeground + "20"
          : colors.primary + "15",
        borderWidth: 1,
        borderColor: isDisabled ? colors.mutedForeground + "30" : colors.primary + "30",
      };
    case "text":
      return {
        backgroundColor: "transparent",
        borderWidth: 0,
      };
    default:
      return {};
  }
};

// Text color configurations
export const getTextColor = (variant: ButtonVariant, isDisabled: boolean, colors: ThemeColors, colorScheme: ColorScheme) => {
  if (isDisabled) {
    return variant === "secondary" ||
      variant === "text" ||
      variant === "ghost"
      ? colors.mutedForeground
      : colors.primaryForeground;
  }

  switch (variant) {
    case "primary":
    case "danger":
    case "success":
      return colors.primaryForeground;
    case "secondary":
    case "ghost":
    case "text":
      return colors.primary;
    default:
      return colors.primaryForeground;
  }
};

export const createButtonStyle = (size: ButtonSize, variantStyle: ViewStyle, fullWidth: boolean, isDisabled: boolean, variant: ButtonVariant): ViewStyle => ({
  ...size,
  ...variantStyle,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  opacity: isDisabled && variant !== "secondary" ? 0.6 : 1,
  ...(fullWidth && { width: "100%" }),
});

export const createTextStyle = (size: ButtonSize, textColor: string): TextStyle => ({
  color: textColor,
  fontSize: size.fontSize,
  fontWeight: "700",
  textAlign: "center",
  letterSpacing: 0.3,
});
