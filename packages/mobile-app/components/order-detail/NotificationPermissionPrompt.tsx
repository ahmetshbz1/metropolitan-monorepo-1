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
  const { user, isAuthenticated, updateUserProfile } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkShouldShowPrompt();
  }, [isAuthenticated]);

  const checkShouldShowPrompt = async () => {
    try {
      // Guest kullanıcıya gösterme
      if (!isAuthenticated) {
        setShouldShow(false);
        return;
      }

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

      // Show only if no permission and authenticated
      setShouldShow(!hasPermission && isAuthenticated);
    } catch (error) {
      // Removed console statement
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
      // Removed console statement
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
      className="mx-4 mb-4 p-5 rounded-xl"
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="flex-row items-start mb-4">
        <View
          className="mr-3 p-2.5 rounded-full"
          style={{
            backgroundColor: colors.primary + "15",
          }}
        >
          <Ionicons
            name="notifications"
            size={22}
            color={colors.primary}
          />
        </View>

        <View className="flex-1">
          <ThemedText className="font-bold text-base mb-1.5">
            {t("order_notification.title")}
          </ThemedText>
          <ThemedText className="text-sm opacity-70 leading-5">
            {t("order_notification.description")}
          </ThemedText>
        </View>

        <HapticButton onPress={handleDismiss} className="ml-1 p-1">
          <Ionicons
            name="close-circle"
            size={22}
            color={colors.mediumGray}
          />
        </HapticButton>
      </View>

      <View className="gap-2">
        <HapticButton
          onPress={handleRequestPermission}
          disabled={loading}
          className="py-3.5 rounded-xl"
          style={{
            backgroundColor: colors.primary,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <ThemedText className="text-center font-semibold text-base text-white">
            {loading
              ? t("common.loading")
              : t("order_notification.enable_notifications")}
          </ThemedText>
        </HapticButton>

        <HapticButton
          onPress={handleDismiss}
          className="py-2.5 rounded-xl"
          style={{
            backgroundColor: "transparent",
          }}
        >
          <ThemedText className="text-center text-sm opacity-60">
            {t("order_notification.later")}
          </ThemedText>
        </HapticButton>
      </View>
    </View>
  );
}