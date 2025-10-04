//  "NotificationItem.tsx"
//  metropolitan app
//  Rebuilt for simplicity and stability

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BaseCard } from "@/components/base/BaseCard";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import type { IoniconsName } from "@/types/ionicons.types";
import type { Notification } from "@/types/notifications.types";
import {
  formatTime,
  getNotificationColor,
  getNotificationIcon,
} from "@/utils/notifications.utils";

interface NotificationItemProps {
  item: Notification;
  onPress: () => void;
  onDelete: () => void;
}

export function NotificationItem({
  item,
  onPress,
  onDelete,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeletePress = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  const renderRightActions = (
    progress: Animated.AnimatedAddition<number>,
    _dragX: Animated.AnimatedAddition<number>
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        className="justify-center items-center bg-red-500 mb-3 rounded-2xl"
        style={[
          {
            width: 80,
            marginLeft: 8,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleDeletePress}
          className="flex-1 justify-center items-center px-4"
        >
          <Ionicons name="trash-outline" size={24} color="white" />
          <ThemedText
            className="text-white text-xs mt-1 font-medium"
            lightColor="#FFFFFF"
            darkColor="#FFFFFF"
          >
            {t("common.delete")}
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        rightThreshold={40}
        friction={2}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          style={{ marginBottom: 12 }}
        >
          <BaseCard
            borderRadius={16}
            style={{ opacity: item.isRead ? 0.6 : 1 }}
            padding={0}
          >
            <ThemedView
              className="p-4 overflow-hidden rounded-2xl flex-row items-start"
              lightColor={Colors.light.card}
              darkColor={Colors.dark.card}
            >
              {/* Bildirim ikonu */}
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5"
                style={{
                  backgroundColor:
                    getNotificationColor(item.type, colors.tint) + "20",
                }}
              >
                <Ionicons
                  name={getNotificationIcon(item.type) as IoniconsName}
                  size={20}
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
                      className="w-2 h-2 rounded-full mt-1.5"
                      style={{ backgroundColor: colors.tint }}
                    />
                  )}
                </View>

                <ThemedText
                  className="mb-1.5 leading-5 opacity-70"
                  style={{ fontSize: 14 }}
                >
                  {item.body}
                </ThemedText>

                <ThemedText className="opacity-50" style={{ fontSize: 12 }}>
                  {formatTime(item.createdAt, t)}
                </ThemedText>
              </View>
            </ThemedView>
          </BaseCard>
        </TouchableOpacity>
      </Swipeable>

      <ConfirmationDialog
        visible={showDeleteDialog}
        title={t("notifications.delete_title")}
        message={t("notifications.delete_message")}
        icon="trash-outline"
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
