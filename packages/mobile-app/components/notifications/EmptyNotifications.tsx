//  "EmptyNotifications.tsx"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

import { ThemedText } from "@/components/ThemedText";
import { EmptyNotificationsProps } from "@/types/notifications.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function EmptyNotifications({ colors }: EmptyNotificationsProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: colors.text + "10" }}
      >
        <Ionicons
          name="notifications-outline"
          size={40}
          color={colors.text + "40"}
        />
      </View>
      <ThemedText type="subtitle" className="text-center mb-2">
        {t("notifications.empty_title")}
      </ThemedText>
      <ThemedText
        className="text-center leading-5"
        style={{ color: colors.text + "60" }}
      >
        {t("notifications.empty_message")}
      </ThemedText>
    </View>
  );
}
