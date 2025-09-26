import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, Alert } from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import notificationService from "@/core/firebase/notifications/notificationService";
import { showHaptic } from "@/utils/haptic";

export function NotificationPermissionPrompt() {
  const { t } = useTranslation();
  const { user, updateUserProfile } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkShouldShowPrompt();
  }, []);

  const checkShouldShowPrompt = async () => {
    try {
      // Check if already dismissed
      const wasDismissed = await AsyncStorage.getItem(
        "order_notification_prompt_dismissed"
      );
      if (wasDismissed === "true") {
        setShouldShow(false);
        return;
      }

      // Check if already has permission
      const hasPermission = await notificationService.hasNotificationPermission();
      setHasPermission(hasPermission);

      // Show only if no permission and not guest
      setShouldShow(!hasPermission && !user?.isGuest);
    } catch (error) {
      console.error("Error checking notification permission:", error);
      setShouldShow(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      setLoading(true);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === "denied") {
        Alert.alert(
          t("order_notification.permission_denied_title"),
          t("order_notification.permission_denied_message"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("order_notification.open_settings"),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      const token = await notificationService.registerForPushNotifications();

      if (token) {
        setHasPermission(true);
        setShouldShow(false);
        await AsyncStorage.setItem("notification_permission_granted", "true");

        // Update user profile
        if (user && !user.isGuest) {
          await updateUserProfile({ pushNotifications: true });
        }

        showHaptic("success");
        Alert.alert(
          t("order_notification.permission_granted_title"),
          t("order_notification.permission_granted_message")
        );
      }
    } catch (error) {
      console.error("Bildirim izni hatası:", error);
      Alert.alert(
        t("common.error"),
        t("order_notification.permission_error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem("order_notification_prompt_dismissed", "true");
    setDismissed(true);
    setShouldShow(false);
    showHaptic("light");
  };

  if (!shouldShow || dismissed) {
    return null;
  }

  return (
    <View
      className="mx-4 mb-4 p-4 rounded-2xl"
      style={{
        backgroundColor: colors.primary + "10",
        borderWidth: 1,
        borderColor: colors.primary + "20",
      }}
    >
      <View className="flex-row items-start mb-3">
        <View
          className="mr-3 p-2 rounded-full"
          style={{
            backgroundColor: colors.primary + "20",
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.primary}
          />
        </View>

        <View className="flex-1">
          <ThemedText className="font-semibold text-base mb-1">
            {t("order_notification.title")}
          </ThemedText>
          <ThemedText className="text-sm opacity-80">
            {t("order_notification.description")}
          </ThemedText>
        </View>

        <HapticButton onPress={handleDismiss} className="ml-2">
          <Ionicons
            name="close"
            size={20}
            color={colors.mediumGray}
          />
        </HapticButton>
      </View>

      <View className="flex-row gap-3">
        <HapticButton
          onPress={handleRequestPermission}
          disabled={loading}
          className="flex-1 py-3 rounded-xl"
          style={{
            backgroundColor: colors.primary,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <ThemedText className="text-center font-semibold text-white">
            {loading
              ? t("common.loading")
              : t("order_notification.enable_notifications")}
          </ThemedText>
        </HapticButton>

        <HapticButton
          onPress={handleDismiss}
          className="px-4 py-3 rounded-xl"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ThemedText className="text-center">
            {t("order_notification.later")}
          </ThemedText>
        </HapticButton>
      </View>
    </View>
  );
}