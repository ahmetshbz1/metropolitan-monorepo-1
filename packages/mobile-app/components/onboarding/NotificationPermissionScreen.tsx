import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, ActivityIndicator, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
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
  const { isGuest, guestId } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const token = await notificationService.registerForPushNotifications(isGuest ? guestId || undefined : undefined);

      if (token) {
        await AsyncStorage.setItem("notification_permission_granted", "true");
        await AsyncStorage.setItem("onboarding_notification_asked", "true");
        showHaptic("success");
      } else {
        await AsyncStorage.setItem("onboarding_notification_asked", "true");
      }
    } catch (error) {
      await AsyncStorage.setItem("onboarding_notification_asked", "true");
    } finally {
      setLoading(false);
      onContinue();
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
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }}
      >
        {/* İllüstrasyon Alanı */}
        <View className="flex-1 items-center justify-center">
          <View
            className="w-36 h-36 rounded-full items-center justify-center mb-8"
            style={{
              backgroundColor: colors.primary + "15",
            }}
          >
            <Ionicons
              name="notifications"
              size={72}
              color={colors.primary}
            />
          </View>

          {/* Başlık ve Açıklama */}
          <ThemedText className="text-3xl font-bold text-center mb-4">
            {t("onboarding.notification_title")}
          </ThemedText>

          <ThemedText className="text-base text-center opacity-70 px-4 leading-6">
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
              className="flex-row items-center mb-3.5"
            >
              <View
                className="w-11 h-11 rounded-full items-center justify-center mr-3.5"
                style={{
                  backgroundColor: colors.primary + "15",
                }}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <ThemedText className="flex-1 text-base opacity-90">
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
            className="py-4 rounded-xl mb-3"
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
            className="py-3 rounded-xl"
            style={{
              backgroundColor: "transparent",
            }}
          >
            <ThemedText
              className="text-center text-base opacity-60"
            >
              {t("onboarding.skip_for_now")}
            </ThemedText>
          </HapticButton>
        </View>
      </View>
    </View>
  );
}