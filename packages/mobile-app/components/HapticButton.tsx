//  "HapticButton.tsx"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import React, { useRef, useCallback } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useHaptics } from "@/hooks/useHaptics";
import { useThemeColor } from "@/hooks/useThemeColor";

export interface HapticButtonProps
  extends Omit<TouchableOpacityProps, "onPress"> {
  children?: React.ReactNode;
  title?: string;
  isLoading?: boolean;
  onPress?: (event?: GestureResponderEvent) => void;
  className?: string;
  debounceDelay?: number; // Varsayılan 500ms
  disableDebounce?: boolean; // Debounce'u devre dışı bırakmak için
}

export function HapticButton({
  onPress,
  children,
  title,
  isLoading,
  disabled,
  style,
  className,
  debounceDelay = 500,
  disableDebounce = false,
  ...props
}: HapticButtonProps) {
  const { withHapticFeedback } = useHaptics();
  const backgroundColor = useThemeColor({}, "tint");
  const lastPressTime = useRef(0);
  const isPressing = useRef(false);

  const handlePressWithDebounce = useCallback(
    (event?: GestureResponderEvent) => {
      const now = Date.now();

      // Debounce kontrolü - devre dışı değilse uygula
      if (!disableDebounce) {
        // Son tıklamadan bu yana geçen süre kontrolü
        if (now - lastPressTime.current < debounceDelay) {
          // Debug mode kontrolü ile log
          if (__DEV__) {
            console.log(`Button press debounced (${debounceDelay}ms)`);
          }
          return;
        }

        // Eğer zaten işlem yapılıyorsa, yeni tıklamaları engelle
        if (isPressing.current) {
          if (__DEV__) {
            console.log("Button press already in progress");
          }
          return;
        }
      }

      // Tıklama zamanını güncelle
      lastPressTime.current = now;
      isPressing.current = true;

      // Haptic feedback ile onPress'i çağır
      if (onPress) {
        onPress(event);
      }

      // İşlem tamamlandıktan sonra flag'i sıfırla
      setTimeout(() => {
        isPressing.current = false;
      }, 100); // Kısa bir süre bekle
    },
    [onPress, debounceDelay, disableDebounce]
  );

  const handlePress = withHapticFeedback(handlePressWithDebounce);

  const content = isLoading ? (
    <ActivityIndicator color="#FFFFFF" />
  ) : (
    children || (
      <Text className="text-base font-bold" style={{ color: "#FFFFFF" }}>
        {title}
      </Text>
    )
  );

  // Apply default button styles only when title is provided (not children)
  const shouldApplyDefaultStyles = title && !children;

  const buttonClassName = shouldApplyDefaultStyles
    ? `py-3 px-5 rounded-xl justify-center items-center flex-row${className ? ` ${className}` : ""}`
    : className;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled || isLoading}
      className={buttonClassName}
      style={[
        shouldApplyDefaultStyles && {
          backgroundColor: backgroundColor as string,
        },
        (disabled || isLoading) && { opacity: 0.5 },
        style,
      ]}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
}

// Titreşim özelliği olan simge butonu
export interface HapticIconButtonProps extends HapticButtonProps {
  size?: number;
}

export function HapticIconButton({
  onPress,
  children,
  style,
  className,
  size = 40,
  ...props
}: HapticIconButtonProps) {
  const { withHapticFeedback } = useHaptics();
  const handlePress = withHapticFeedback(onPress);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.5}
      className={`justify-center items-center${className ? ` ${className}` : ""}`}
      style={[{ width: size, height: size }, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
