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
        className="justify-center items-center mb-3"
        style={[
          {
            width: 75,
            marginLeft: 12,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleDeletePress}
          className="flex-1 justify-center items-center bg-red-500 rounded-2xl"
          style={{
            width: "100%",
            height: "100%",
            shadowColor: "#ef4444",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Ionicons name="trash" size={22} color="white" />
          <ThemedText
            className="text-white text-xs mt-0.5 font-semibold"
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
          activeOpacity={0.95}
          style={{ marginBottom: 12 }}
        >
          <BaseCard
            borderRadius={20}
            style={{
              opacity: item.isRead ? 0.7 : 1,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: item.isRead ? 1 : 3,
              },
              shadowOpacity: item.isRead ? 0.1 : 0.15,
              shadowRadius: item.isRead ? 2 : 4,
              elevation: item.isRead ? 2 : 5,
            }}
            padding={0}
          >
            <ThemedView
              className="p-4 overflow-hidden rounded-2xl flex-row items-start"
              lightColor={item.isRead ? Colors.light.card : "#FFFFFF"}
              darkColor={item.isRead ? Colors.dark.card : "#1a1a1a"}
            >
              {/* Bildirim ikonu - gradient background */}
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                style={{
                  backgroundColor: item.isRead
                    ? getNotificationColor(item.type, colors.tint) + "15"
                    : getNotificationColor(item.type, colors.tint) + "25",
                  borderWidth: 1,
                  borderColor: getNotificationColor(item.type, colors.tint) + "20",
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
                <View className="flex-row items-start justify-between mb-1.5">
                  <ThemedText
                    type="defaultSemiBold"
                    className="flex-1 mr-2"
                    style={{ fontSize: 16, lineHeight: 20 }}
                  >
                    {item.title}
                  </ThemedText>
                  {!item.isRead && (
                    <View className="mt-1">
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: colors.tint,
                          shadowColor: colors.tint,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.5,
                          shadowRadius: 3,
                        }}
                      />
                    </View>
                  )}
                </View>

                <ThemedText
                  className="mb-2 leading-5"
                  style={{
                    fontSize: 14,
                    opacity: item.isRead ? 0.6 : 0.75,
                    lineHeight: 20,
                  }}
                >
                  {item.body}
                </ThemedText>

                <View className="flex-row items-center">
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={colors.text + "50"}
                  />
                  <ThemedText className="ml-1 opacity-50" style={{ fontSize: 12 }}>
                    {formatTime(item.createdAt, t)}
                  </ThemedText>
                </View>
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
