//  "ThemedView.tsx"
//  metropolitan app
//  Created by Ahmet on 18.06.2025.

import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  className,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return (
    <View
      className={className}
      style={[{ backgroundColor: backgroundColor as string }, style]}
      {...otherProps}
    />
  );
}
