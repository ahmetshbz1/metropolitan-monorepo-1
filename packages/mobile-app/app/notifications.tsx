//  "notifications.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemedView } from "@/components/ThemedView";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import {
  EmptyNotifications,
  NotificationActionButtons,
  NotificationItem,
} from "@/components/notifications";
import { NotificationSkeletonList } from "@/components/notifications/NotificationSkeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();

  // Set screen title once on mount
  useEffect(() => {
    navigation.setOptions({
      title: t("notifications.title"),
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: "600",
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

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
    deleteDialogState,
    hideDeleteDialog,
    handleDeleteConfirm,
    deleteAllDialogState,
    hideDeleteAllDialog,
    handleDeleteAllConfirm,
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
        {/* Bildirim listesi */}
        {isLoading ? (
          <NotificationSkeletonList />
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

        <ConfirmationDialog
          visible={deleteDialogState.visible}
          title={deleteDialogState.title}
          message={deleteDialogState.message}
          icon={deleteDialogState.icon}
          confirmText={deleteDialogState.confirmText}
          cancelText={deleteDialogState.cancelText}
          destructive={deleteDialogState.destructive}
          loading={deleteDialogState.loading}
          onConfirm={handleDeleteConfirm}
          onCancel={hideDeleteDialog}
        />

        <ConfirmationDialog
          visible={deleteAllDialogState.visible}
          title={deleteAllDialogState.title}
          message={deleteAllDialogState.message}
          icon={deleteAllDialogState.icon}
          confirmText={deleteAllDialogState.confirmText}
          cancelText={deleteAllDialogState.cancelText}
          destructive={deleteAllDialogState.destructive}
          loading={deleteAllDialogState.loading}
          onConfirm={handleDeleteAllConfirm}
          onCancel={hideDeleteAllDialog}
        />
      </ThemedView>
    </GestureHandlerRootView>
  );
}
