//  "SettingsItem.tsx"
//  metropolitan app
//  Created by Ahmet on 08.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Switch, View } from "react-native";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

type SettingsItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  type: "toggle" | "link" | "display";
  value?: boolean | string;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
};

export function SettingsItem({
  icon,
  label,
  type,
  value,
  onValueChange,
  onPress,
}: SettingsItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const content = (
    <>
      <Ionicons name={icon} size={20} color={colors.darkGray} />
      <ThemedText className="flex-1 ml-4 text-base">{label}</ThemedText>
      {type === "toggle" && (
        <Switch
          trackColor={{ false: "#dcdcdc", true: "#4CD964" }}
          thumbColor={value ? "#FFFFFF" : "#f4f3f4"}
          ios_backgroundColor="#dcdcdc"
          onValueChange={onValueChange}
          value={value as boolean}
        />
      )}
      {type === "display" && typeof value === "string" && (
        <ThemedText className="text-base" style={{ color: colors.darkGray }}>
          {value}
        </ThemedText>
      )}
      {type === "link" && (
        <Ionicons name="chevron-forward" size={18} color={colors.darkGray} />
      )}
    </>
  );

  if (type === "link") {
    return (
      <HapticButton
        className="flex-row items-center justify-between py-3 px-0 rounded-none"
        style={{ backgroundColor: "transparent" }}
        hapticType="light"
        onPress={onPress}
      >
        {content}
      </HapticButton>
    );
  }

  return (
    <View className="flex-row items-center justify-between py-3">
      {content}
    </View>
  );
}
