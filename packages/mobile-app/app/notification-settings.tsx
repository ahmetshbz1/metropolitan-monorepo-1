import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  View,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import notificationService from "@/core/firebase/notifications/notificationService";
import api from "@/core/api";
import { showHaptic } from "@/utils/haptic";

type NotificationSetting = {
  id: string;
  title: string;
  description: string;
  key: keyof NotificationPreferences;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
};

type NotificationPreferences = {
  orderUpdates: boolean;
  promotions: boolean;
  priceAlerts: boolean;
  newProducts: boolean;
  generalNotifications: boolean;
};

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    promotions: false,
    priceAlerts: false,
    newProducts: false,
    generalNotifications: true,
  });

  // Bildirim iznini kontrol et
  const checkPermission = useCallback(async () => {
    const hasPermission = await notificationService.hasNotificationPermission();
    setHasPermission(hasPermission);

    // Kullanıcı tercihlerini yükle
    if (user?.notificationPreferences) {
      setPreferences(user.notificationPreferences);
    }
  }, [user]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Bildirim izni iste
  const requestPermission = async () => {
    try {
      setLoading(true);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === "denied") {
        Alert.alert(
          t("notification_settings.permission_denied_title"),
          t("notification_settings.permission_denied_message"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("notification_settings.open_settings"),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      const token = await notificationService.registerForPushNotifications();

      if (token) {
        setHasPermission(true);
        await AsyncStorage.setItem("notification_permission_granted", "true");

        // Backend'e bildir
        if (user && !user.isGuest) {
          await updateUserProfile({ pushNotifications: true });
        }

        showHaptic("success");
        Alert.alert(
          t("notification_settings.permission_granted_title"),
          t("notification_settings.permission_granted_message")
        );
      }
    } catch (error) {
      console.error("Bildirim izni hatası:", error);
      Alert.alert(
        t("common.error"),
        t("notification_settings.permission_error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Tercih değişikliği
  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!hasPermission && value) {
      Alert.alert(
        t("notification_settings.permission_required_title"),
        t("notification_settings.permission_required_message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("notification_settings.enable"),
            onPress: () => requestPermission(),
          },
        ]
      );
      return;
    }

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Backend'e kaydet
    if (user && !user.isGuest) {
      try {
        await api.put("/user/notification-preferences", newPreferences);
        await updateUserProfile({ notificationPreferences: newPreferences });
        showHaptic("light");
      } catch (error) {
        console.error("Tercih güncelleme hatası:", error);
        // Geri al
        setPreferences(preferences);
        Alert.alert(
          t("common.error"),
          t("notification_settings.update_error")
        );
      }
    }
  };

  const settings: NotificationSetting[] = [
    {
      id: "orderUpdates",
      title: t("notification_settings.order_updates"),
      description: t("notification_settings.order_updates_desc"),
      key: "orderUpdates",
      icon: "cart-outline",
      enabled: preferences.orderUpdates,
    },
    {
      id: "promotions",
      title: t("notification_settings.promotions"),
      description: t("notification_settings.promotions_desc"),
      key: "promotions",
      icon: "pricetag-outline",
      enabled: preferences.promotions,
    },
    {
      id: "priceAlerts",
      title: t("notification_settings.price_alerts"),
      description: t("notification_settings.price_alerts_desc"),
      key: "priceAlerts",
      icon: "trending-down-outline",
      enabled: preferences.priceAlerts,
    },
    {
      id: "newProducts",
      title: t("notification_settings.new_products"),
      description: t("notification_settings.new_products_desc"),
      key: "newProducts",
      icon: "sparkles-outline",
      enabled: preferences.newProducts,
    },
    {
      id: "generalNotifications",
      title: t("notification_settings.general"),
      description: t("notification_settings.general_desc"),
      key: "generalNotifications",
      icon: "notifications-outline",
      enabled: preferences.generalNotifications,
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: t("notification_settings.title"),
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />

      <ThemedView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 20,
          }}
        >
          {/* Bildirim İzni Durumu */}
          {!hasPermission && (
            <View
              className="mx-4 mb-5 p-4 rounded-2xl"
              style={{
                backgroundColor: colors.warning + "15",
                borderWidth: 1,
                borderColor: colors.warning + "30",
              }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons
                  name="notifications-off-outline"
                  size={24}
                  color={colors.warning}
                />
                <ThemedText className="ml-2 font-semibold text-base">
                  {t("notification_settings.permission_disabled")}
                </ThemedText>
              </View>

              <ThemedText className="text-sm opacity-80 mb-3">
                {t("notification_settings.permission_disabled_desc")}
              </ThemedText>

              <HapticButton
                onPress={requestPermission}
                disabled={loading}
                className="py-3 rounded-xl"
                style={{
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText className="text-center font-semibold text-white">
                    {t("notification_settings.enable_notifications")}
                  </ThemedText>
                )}
              </HapticButton>
            </View>
          )}

          {/* Bildirim Tercihleri */}
          <View className="mx-4">
            <ThemedText className="text-sm font-semibold opacity-60 uppercase mb-3">
              {t("notification_settings.preferences")}
            </ThemedText>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {settings.map((setting, index) => (
                <View
                  key={setting.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderBottomWidth: index < settings.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "15",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name={setting.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <ThemedText className="text-base font-medium">
                      {setting.title}
                    </ThemedText>
                    <ThemedText className="text-xs opacity-60 mt-0.5">
                      {setting.description}
                    </ThemedText>
                  </View>

                  <Switch
                    value={setting.enabled}
                    onValueChange={(value) =>
                      handlePreferenceChange(setting.key, value)
                    }
                    disabled={!hasPermission && !setting.enabled}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor={
                      Platform.OS === "android"
                        ? setting.enabled
                          ? colors.primary
                          : "#f4f3f4"
                        : "#f4f3f4"
                    }
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Bilgi Notu */}
          <View className="mx-4 mt-6">
            <View
              className="p-4 rounded-xl"
              style={{
                backgroundColor: colors.primary + "10",
              }}
            >
              <View className="flex-row">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.primary}
                  style={{ marginTop: 2 }}
                />
                <ThemedText className="ml-2 flex-1 text-sm opacity-80">
                  {t("notification_settings.info_text")}
                </ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </>
  );
}