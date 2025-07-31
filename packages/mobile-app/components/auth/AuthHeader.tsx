//  "AuthHeader.tsx"
//  metropolitan app
//  Created by Ahmet on 08.07.2025.

import { Text, View, ViewStyle } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  style?: ViewStyle;
}

export const AuthHeader = ({ title, subtitle, style }: AuthHeaderProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  return (
    <View className="items-center justify-center px-8" style={style}>
      <Text
        className="text-3xl font-bold mb-2 text-center"
        style={{ color: themeColors.text }}
      >
        {title}
      </Text>
      <Text
        className="text-base text-center leading-6 opacity-80"
        style={{ color: themeColors.text }}
      >
        {subtitle}
      </Text>
    </View>
  );
};
