//  "BaseInput.tsx"
//  metropolitan app
//  Created by Ahmet on 01.06.2025.
//  Redesigned on 23.09.2025 for modern minimalist experience

import React, { forwardRef } from "react";
import {
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TextStyle,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { zincColors } from "@/constants/colors/zincColors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";

export type InputVariant = "default" | "filled" | "outlined" | "ghost";
export type InputSize = "small" | "medium" | "large";

export interface BaseInputProps extends Omit<RNTextInputProps, "style"> {
  label?: string;
  error?: string;
  variant?: InputVariant;
  size?: InputSize;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const BaseInput = forwardRef<RNTextInput, BaseInputProps>(
  (
    {
      label,
      error,
      variant = "default",
      size = "medium",
      containerStyle,
      inputStyle,
      disabled = false,
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const themeColors = Colors[colorScheme ?? "light"];

    const sizeStyles: Record<
      InputSize,
      { height?: number; fontSize: number; padding: number }
    > = {
      small: { height: 44, fontSize: 15, padding: 12 },
      medium: { height: 52, fontSize: 16, padding: 14 },
      large: { height: 60, fontSize: 18, padding: 18 },
    };

    const getVariantStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: 12,
        backgroundColor: isDark ? zincColors[900] : zincColors[100],
      };

      switch (variant) {
        case "filled":
          return {
            ...baseStyle,
            backgroundColor: isDark ? zincColors[800] : zincColors[200],
          };
        case "outlined":
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: isDark ? zincColors[700] : zincColors[300],
          };
        case "ghost":
          return {
            ...baseStyle,
            backgroundColor: "transparent",
          };
        default:
          return baseStyle;
      }
    };

    const getTextColor = () => {
      if (disabled) {
        return isDark ? zincColors[600] : zincColors[400];
      }
      return isDark ? zincColors[50] : zincColors[900];
    };

    return (
      <View style={[styles.container, fullWidth && { width: "100%" }, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
        )}
        <View
          style={[
            getVariantStyle(),
            disabled && styles.disabled,
            error && styles.errorBorder,
          ]}
        >
          <RNTextInput
            ref={ref}
            style={[
              {
                height: sizeStyles[size].height,
                fontSize: sizeStyles[size].fontSize,
                padding: sizeStyles[size].padding,
                color: getTextColor(),
              },
              inputStyle,
            ]}
            placeholderTextColor={isDark ? zincColors[500] : zincColors[400]}
            editable={!disabled}
            {...props}
          />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }
);

BaseInput.displayName = "BaseInput";

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  error: {
    color: "#ef4444",
    marginTop: 4,
    fontSize: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: "#ef4444",
  },
});

// Export default for backwards compatibility
export default BaseInput;