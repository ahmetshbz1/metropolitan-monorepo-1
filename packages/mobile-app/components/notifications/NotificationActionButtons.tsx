//  "NotificationActionButtons.tsx"
//  metropolitan app
//  Created by Ahmet on 30.06.2025.

import { NotificationActionButtonsProps } from "@/types/notifications.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

export function NotificationActionButtons({
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onDeleteAll,
  colors,
}: NotificationActionButtonsProps) {
  const { t } = useTranslation();

  if (notifications.length === 0) return null;

  return (
    <View className="px-4 py-6">
      <View className="flex-row gap-2 justify-center">
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={onMarkAllAsRead}
            className="flex-row items-center justify-center py-1.5 px-3 rounded-lg"
            style={{ backgroundColor: colors.text + "05" }}
          >
            <Ionicons
              name="checkmark-done"
              size={14}
              color={colors.tint}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color: colors.text + "60",
                fontSize: 12,
                fontWeight: "500",
              }}
            >
              {t("notifications.mark_all_read")}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onDeleteAll}
          className="flex-row items-center justify-center py-1.5 px-3 rounded-lg"
          style={{ backgroundColor: colors.text + "05" }}
        >
          <Ionicons
            name="trash-outline"
            size={14}
            color="#FF6B6B"
            style={{ marginRight: 4 }}
          />
          <Text
            style={{
              color: colors.text + "60",
              fontSize: 12,
              fontWeight: "500",
            }}
          >
            {t("notifications.delete_all")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
