//  "AddressInfoLine.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface AddressInfoLineProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

export const AddressInfoLine = ({ icon, text }: AddressInfoLineProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View className="flex-row items-center">
      <Ionicons
        name={icon}
        size={16}
        color={colors.textSecondary}
        style={{ marginRight: 8 }}
      />
      <ThemedText className="text-sm flex-1">{text}</ThemedText>
    </View>
  );
};