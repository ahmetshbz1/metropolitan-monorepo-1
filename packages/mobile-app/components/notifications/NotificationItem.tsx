//  "NotificationItem.tsx"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { NotificationItemProps } from "@/types/notifications.types";
import { IoniconsName } from "@/types/ionicons.types";
import {
  formatTime,
  getNotificationColor,
  getNotificationIcon,
} from "@/utils/notifications.utils";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SwipeActions } from "./SwipeActions";

export function NotificationItem({
  item,
  onPress,
  onDelete,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { renderRightActions } = SwipeActions({ item, onDelete });

  const handlePress = () => {
    onPress(item);
  };

  const handleSwipeWillOpen = (direction: "left" | "right") => {
    if (direction === "right") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
      onSwipeableWillOpen={handleSwipeWillOpen}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={{ marginBottom: 16 }}
      >
        <BaseCard
          borderRadius={16}
          style={{ opacity: item.isRead ? 0.6 : 1 }}
          padding={0}
        >
          <ThemedView
            className="p-5 overflow-hidden rounded-2xl flex-row items-start"
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
          >
            {/* Bildirim ikonu */}
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-4 mt-1"
              style={{
                backgroundColor:
                  getNotificationColor(item.type, colors.tint) + "20",
              }}
            >
              <Ionicons
                name={getNotificationIcon(item.type) as IoniconsName}
                size={22}
                color={getNotificationColor(item.type, colors.tint)}
              />
            </View>

            {/* Bildirim içeriği */}
            <View className="flex-1">
              <View className="flex-row items-start justify-between mb-1">
                <ThemedText type="defaultSemiBold" className="flex-1 mr-2">
                  {item.title}
                </ThemedText>
                {!item.isRead && (
                  <View
                    className="w-2.5 h-2.5 rounded-full mt-1.5"
                    style={{ backgroundColor: colors.tint }}
                  />
                )}
              </View>

              <ThemedText
                className="mb-2 leading-5 opacity-70"
                style={{ fontSize: 14 }}
              >
                {item.message}
              </ThemedText>

              <ThemedText className="opacity-50" style={{ fontSize: 12 }}>
                {formatTime(item.createdAt, t)}
              </ThemedText>
            </View>
          </ThemedView>
        </BaseCard>
      </TouchableOpacity>
    </Swipeable>
  );
}
