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
      paddingVertical: 10,
      paddingHorizontal: 20,
      fontSize: 14,
      borderRadius: 12,
    },
    medium: {
      paddingVertical: 14,
      paddingHorizontal: 28,
      fontSize: 16,
      borderRadius: 16,
    },
    large: {
      paddingVertical: 18,
      paddingHorizontal: 36,
      fontSize: 18,
      borderRadius: 20,
    },
  };

  // Variant configurations
  const getVariantStyle = (variant: ButtonVariant, isDisabled: boolean) => {
    const baseStyle = {
      // Shadow'lar kaldırıldı - daha modern flat tasarım
    };

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
    opacity: isDisabled && variant !== "secondary" ? 0.6 : 1,
    ...(fullWidth && { width: "100%" }),
  };

  const buttonTextStyle: TextStyle = {
    color: textColor,
    fontSize: currentSize.fontSize,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  };

  const content = loading ? (
    <ActivityIndicator color={textColor} size="small" />
  ) : (
    children || <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[buttonStyle, style]}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};
