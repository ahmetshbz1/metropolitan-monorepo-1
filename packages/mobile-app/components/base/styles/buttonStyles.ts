//  "buttonStyles.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { ViewStyle, TextStyle } from "react-native";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost"
  | "text";

// Variant configurations
export const getVariantStyle = (variant: ButtonVariant, isDisabled: boolean, colors: any) => {
  switch (variant) {
    case "primary":
      return {
        backgroundColor: isDisabled ? colors.disabled : colors.tint,
        borderWidth: 0,
      };
    case "secondary":
      return {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: isDisabled ? colors.disabled : colors.tint,
      };
    case "danger":
      return {
        backgroundColor: isDisabled ? colors.disabled : colors.danger,
        borderWidth: 0,
      };
    case "success":
      return {
        backgroundColor: isDisabled ? colors.disabled : colors.success,
        borderWidth: 0,
      };
    case "ghost":
      return {
        backgroundColor: isDisabled
          ? colors.disabled + "20"
          : colors.tint + "15",
        borderWidth: 1,
        borderColor: isDisabled ? colors.disabled + "30" : colors.tint + "30",
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
export const getTextColor = (variant: ButtonVariant, isDisabled: boolean, colors: any, colorScheme: string) => {
  if (isDisabled) {
    return variant === "secondary" ||
      variant === "text" ||
      variant === "ghost"
      ? colors.disabled
      : colorScheme === "dark"
        ? "#D1D5DB"
        : "#FFFFFF";
  }

  switch (variant) {
    case "primary":
    case "danger":
    case "success":
      return colorScheme === "dark" ? "#D1D5DB" : "#FFFFFF";
    case "secondary":
    case "ghost":
    case "text":
      return colors.tint;
    default:
      return colorScheme === "dark" ? "#D1D5DB" : "#FFFFFF";
  }
};

export const createButtonStyle = (size: any, variantStyle: any, fullWidth: boolean, isDisabled: boolean, variant: ButtonVariant): ViewStyle => ({
  ...size,
  ...variantStyle,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  opacity: isDisabled && variant !== "secondary" ? 0.6 : 1,
  ...(fullWidth && { width: "100%" }),
});

export const createTextStyle = (size: any, textColor: string): TextStyle => ({
  color: textColor,
  fontSize: size.fontSize,
  fontWeight: "700",
  textAlign: "center",
  letterSpacing: 0.3,
});
