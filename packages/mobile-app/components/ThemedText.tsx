//  "ThemedText.tsx"
//  metropolitan app
//  Created by Ahmet on 22.06.2025.

import { Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

// Get the system default font family based on platform
const getSystemFontFamily = () => {
  return undefined; // Using undefined lets React Native use the system default font
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  className,
  ...rest
}: ThemedTextProps & { className?: string }) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  const getTypeClassName = () => {
    switch (type) {
      case "title":
        return "text-3xl font-bold leading-8";
      case "defaultSemiBold":
        return "text-base leading-6 font-semibold";
      case "subtitle":
        return "text-xl font-bold";
      case "link":
        return "text-base leading-8";
      case "default":
      default:
        return "text-base leading-6";
    }
  };

  const combinedClassName = `${getTypeClassName()}${className ? ` ${className}` : ""}`;
  const finalColor = type === "link" ? "#0a7ea4" : color;

  return (
    <Text
      className={combinedClassName}
      style={[
        {
          color: finalColor as string,
          fontFamily: getSystemFontFamily(),
        },
        style,
      ]}
      {...rest}
    />
  );
}
