//  "BaseButton.tsx"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

import { HapticType, useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost"
  | "text";

export type ButtonSize = "small" | "medium" | "large";

export interface BaseButtonProps
  extends Omit<TouchableOpacityProps, "onPress"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  hapticType?: HapticType;
  children?: React.ReactNode;
  title?: string;
  loading?: boolean;
  onPress?: (event?: GestureResponderEvent) => void;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  variant = "primary",
  size = "medium",
  hapticType = "light",
  onPress,
  children,
  title,
  loading = false,
  disabled,
  style,
  textStyle,
  fullWidth = false,
  ...props
}) => {
  const { colors } = useTheme();
  const { withHapticFeedback } = useHaptics();

  const handlePress = withHapticFeedback(onPress, hapticType);

  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      borderRadius: 8,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
      borderRadius: 12,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
      borderRadius: 16,
    },
  };

  // Variant configurations
  const getVariantStyle = (variant: ButtonVariant, isDisabled: boolean) => {
    const baseStyle = {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: isDisabled ? colors.disabled : colors.tint,
          borderWidth: 0,
        };
      case "secondary":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: isDisabled ? colors.disabled : colors.tint,
        };
      case "danger":
        return {
          ...baseStyle,
          backgroundColor: isDisabled ? colors.disabled : colors.danger,
          borderWidth: 0,
        };
      case "success":
        return {
          ...baseStyle,
          backgroundColor: isDisabled ? colors.disabled : colors.success,
          borderWidth: 0,
        };
      case "ghost":
        return {
          backgroundColor: isDisabled
            ? colors.disabled + "20"
            : colors.tint + "20",
          borderWidth: 0,
        };
      case "text":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
        };
      default:
        return baseStyle;
    }
  };

  // Text color configurations
  const getTextColor = (variant: ButtonVariant, isDisabled: boolean) => {
    if (isDisabled) {
      return variant === "secondary" ||
        variant === "text" ||
        variant === "ghost"
        ? colors.disabled
        : "#FFFFFF";
    }

    switch (variant) {
      case "primary":
      case "danger":
      case "success":
        return "#FFFFFF";
      case "secondary":
      case "ghost":
      case "text":
        return colors.tint;
      default:
        return "#FFFFFF";
    }
  };

  const currentSize = sizeConfig[size];
  const isDisabled = disabled || loading;
  const variantStyle = getVariantStyle(variant, isDisabled);
  const textColor = getTextColor(variant, isDisabled);

  const buttonStyle: ViewStyle = {
    ...currentSize,
    ...variantStyle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: isDisabled && variant !== "secondary" ? 0.5 : 1,
    ...(fullWidth && { width: "100%" }),
  };

  const buttonTextStyle: TextStyle = {
    color: textColor,
    fontSize: currentSize.fontSize,
    fontWeight: "600",
    textAlign: "center",
  };

  const content = loading ? (
    <ActivityIndicator color={textColor} size="small" />
  ) : (
    children || <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isDisabled}
      style={[buttonStyle, style]}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};
