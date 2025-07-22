//  "HapticButton.tsx"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

import { HapticType, useHaptics } from "@/hooks/useHaptics";
import { useThemeColor } from "@/hooks/useThemeColor";

export interface HapticButtonProps
  extends Omit<TouchableOpacityProps, "onPress"> {
  hapticType?: HapticType;
  children?: React.ReactNode;
  title?: string;
  isLoading?: boolean;
  onPress?: (event?: GestureResponderEvent) => void;
  className?: string;
}

export function HapticButton({
  hapticType = "light",
  onPress,
  children,
  title,
  isLoading,
  disabled,
  style,
  className,
  ...props
}: HapticButtonProps) {
  const { withHapticFeedback } = useHaptics();
  const backgroundColor = useThemeColor({}, "tint");

  const handlePress = withHapticFeedback(onPress, hapticType);

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
  hapticType = "light",
  onPress,
  children,
  style,
  className,
  size = 40,
  ...props
}: HapticIconButtonProps) {
  const { withHapticFeedback } = useHaptics();
  const handlePress = withHapticFeedback(onPress, hapticType);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`justify-center items-center${className ? ` ${className}` : ""}`}
      style={[{ width: size, height: size }, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
