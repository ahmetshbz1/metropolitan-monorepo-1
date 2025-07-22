//  "notifications.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemedView } from "@/components/ThemedView";
import {
  EmptyNotifications,
  NotificationActionButtons,
  NotificationItem,
} from "@/components/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Custom hook kullanarak tüm bildirim işlemlerini yönet
  const {
    notifications,
    isLoading,
    refreshing,
    unreadCount,
    handleNotificationPress,
    deleteNotification,
    markAllAsRead,
    deleteAllNotifications,
    onRefresh,
  } = useNotifications();

  // Bildirim öğesi render fonksiyonu
  const renderNotificationItem = ({ item }: { item: any }) => (
    <NotificationItem
      item={item}
      onPress={handleNotificationPress}
      onDelete={deleteNotification}
    />
  );

  return (
    <GestureHandlerRootView className="flex-1">
      <ThemedView className="flex-1">
        <Stack.Screen
          options={{
            title: t("notifications.title"),
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: "600",
            },
          }}
        />

        {/* Bildirim listesi */}
        {isLoading ? (
          <ThemedView className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.tint} />
          </ThemedView>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 16,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.tint}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => <EmptyNotifications colors={colors} />}
            ListFooterComponent={() => (
              <NotificationActionButtons
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllAsRead={markAllAsRead}
                onDeleteAll={deleteAllNotifications}
                colors={colors}
              />
            )}
          />
        )}
      </ThemedView>
    </GestureHandlerRootView>
  );
}
