import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Alert, ActivityIndicator, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import notificationService from "@/core/firebase/notifications/notificationService";
import { showHaptic } from "@/utils/haptic";

interface NotificationPermissionScreenProps {
  onContinue: () => void;
}

export function NotificationPermissionScreen({ onContinue }: NotificationPermissionScreenProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      const token = await notificationService.registerForPushNotifications();

      if (token) {
        await AsyncStorage.setItem("notification_permission_granted", "true");
        await AsyncStorage.setItem("onboarding_notification_asked", "true");
        showHaptic("success");

        Alert.alert(
          t("onboarding.notification_enabled_title"),
          t("onboarding.notification_enabled_message"),
          [{ text: t("common.continue"), onPress: onContinue }]
        );
      } else {
        // İzin verilmedi ama devam edebilir
        await AsyncStorage.setItem("onboarding_notification_asked", "true");
        onContinue();
      }
    } catch (error) {
      console.error("Notification permission error:", error);
      await AsyncStorage.setItem("onboarding_notification_asked", "true");
      onContinue();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarding_notification_asked", "true");
    await AsyncStorage.setItem("notification_permission_skipped", "true");
    showHaptic("light");
    onContinue();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + "20", colors.background]}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 px-6"
          style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }}
        >
          {/* İllüstrasyon Alanı */}
          <View className="flex-1 items-center justify-center">
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-8"
              style={{
                backgroundColor: colors.primary + "20",
              }}
            >
              <Ionicons
                name="notifications"
                size={64}
                color={colors.primary}
              />
            </View>

            {/* Başlık ve Açıklama */}
            <ThemedText className="text-3xl font-bold text-center mb-4">
              {t("onboarding.notification_title")}
            </ThemedText>

            <ThemedText className="text-base text-center opacity-80 px-4">
              {t("onboarding.notification_description")}
            </ThemedText>
          </View>

          {/* Özellikler */}
          <View className="mb-8">
            {[
              {
                icon: "cart",
                title: t("onboarding.notification_feature_orders"),
              },
              {
                icon: "pricetag",
                title: t("onboarding.notification_feature_deals"),
              },
              {
                icon: "rocket",
                title: t("onboarding.notification_feature_shipping"),
              },
            ].map((feature, index) => (
              <View
                key={index}
                className="flex-row items-center mb-4"
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{
                    backgroundColor: colors.primary + "15",
                  }}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <ThemedText className="flex-1 text-base">
                  {feature.title}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Butonlar */}
          <View>
            <HapticButton
              onPress={handleEnableNotifications}
              disabled={loading}
              className="py-4 rounded-2xl mb-3"
              style={{
                backgroundColor: colors.primary,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText className="text-center text-lg font-semibold text-white">
                  {t("onboarding.enable_notifications")}
                </ThemedText>
              )}
            </HapticButton>

            <HapticButton
              onPress={handleSkip}
              disabled={loading}
              className="py-4 rounded-2xl"
              style={{
                backgroundColor: "transparent",
              }}
            >
              <ThemedText
                className="text-center text-base"
                style={{ color: colors.mediumGray }}
              >
                {t("onboarding.skip_for_now")}
              </ThemedText>
            </HapticButton>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}