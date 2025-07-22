//  "BaseInput.tsx"
//  metropolitan app
//  Created by Ahmet on 01.06.2025.

import { useTheme } from "@/hooks/useTheme";
import React, { forwardRef, useState } from "react";
import { StyleSheet, TextInput, TextInputProps, TextStyle } from "react-native";

export type InputSize = "small" | "medium" | "large";

export interface BaseInputProps extends Omit<TextInputProps, "style"> {
  size?: InputSize;
  error?: boolean;
  fullWidth?: boolean;
  style?: TextStyle;
}

const sizeConfig = {
  small: {
    height: 48,
    fontSize: 15,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  medium: {
    height: 56,
    fontSize: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  large: {
    height: 64,
    fontSize: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
} as const;

export const BaseInput = forwardRef<TextInput, BaseInputProps>(
  (
    {
      size = "medium",
      error = false,
      fullWidth = true,
      onFocus,
      onBlur,
      placeholderTextColor,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [, setFocused] = useState(false);
    const current = sizeConfig[size];

    const dynamicStyle: TextStyle = {
      height: current.height,
      paddingHorizontal: current.paddingHorizontal,
      fontSize: current.fontSize,
      borderRadius: current.borderRadius,
      backgroundColor: colors.card,
      color: colors.text,
      borderWidth: 1,
      borderColor: error ? colors.danger : colors.border,
      ...(fullWidth && { width: "100%" }),
    };

    const inputBaseStyle = StyleSheet.create({
      shadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    });

    return (
      <TextInput
        ref={ref}
        style={[inputBaseStyle.shadow, dynamicStyle, props.style]}
        placeholderTextColor={
          placeholderTextColor ? placeholderTextColor : colors.mediumGray
        }
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    );
  }
);

BaseInput.displayName = "BaseInput";
