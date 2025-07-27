//  "BaseButton.tsx"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  useColorScheme,
} from "react-native";

import { HapticType, useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";
import { buttonSizeConfig, ButtonSize } from "./config/buttonConfig";
import {
  ButtonVariant,
  getVariantStyle,
  getTextColor,
  createButtonStyle,
  createTextStyle,
} from "./styles/buttonStyles";

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
  const colorScheme = useColorScheme();

  const handlePress = withHapticFeedback(onPress, hapticType);

  const currentSize = buttonSizeConfig[size];
  const isDisabled = disabled || loading;
  const variantStyle = getVariantStyle(variant, isDisabled, colors);
  const textColor = getTextColor(variant, isDisabled, colors, colorScheme ?? "light");

  const buttonStyle = createButtonStyle(currentSize, variantStyle, fullWidth, isDisabled, variant);
  const buttonTextStyle = createTextStyle(currentSize, textColor);

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

// Re-export types
export type { ButtonVariant, ButtonSize };
