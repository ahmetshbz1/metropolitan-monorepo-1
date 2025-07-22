//  "ProfileBadge.tsx"
//  metropolitan app
//  Created by Ahmet on 18.06.2025.

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface ProfileBadgeProps {
  type: "b2b" | "b2c";
}

export function ProfileBadge({ type }: ProfileBadgeProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.tint,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
      }}
      accessibilityLabel={t(`profile.badge.${type}`)}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: "600",
        }}
      >
        {t(`profile.badge.${type}`)}
      </Text>
    </View>
  );
}
