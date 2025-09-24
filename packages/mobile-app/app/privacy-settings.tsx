// "privacy-settings.tsx"
// metropolitan app
// Privacy settings page

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "@/hooks/useToast";
import { api } from "@/core/api";
import { useAuth } from "@/context/AuthContext";

interface PrivacySettings {
  shareDataWithPartners: boolean;
  personalizedAds: boolean;
  analyticsData: boolean;
  marketingEmails: boolean;
}

export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [settings, setSettings] = useState<PrivacySettings>({
    shareDataWithPartners: false,
    personalizedAds: true,
    analyticsData: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("privacy_settings.title"),
    });
  }, [navigation, t]);

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (isAuthenticated) {
      try {
        await api.put("/users/user/privacy-settings", newSettings);
      } catch (error) {
        console.error("Failed to update privacy settings:", error);
        setSettings(settings); // Revert on error
      }
    }
  };

  const privacyItems = [
    {
      icon: "share-outline",
      title: t("privacy_settings.data_sharing"),
      subtitle: t("privacy_settings.data_sharing_desc"),
      key: "shareDataWithPartners" as const,
      value: settings.shareDataWithPartners,
    },
    {
      icon: "megaphone-outline",
      title: t("privacy_settings.personalized_ads"),
      subtitle: t("privacy_settings.personalized_ads_desc"),
      key: "personalizedAds" as const,
      value: settings.personalizedAds,
    },
    {
      icon: "analytics-outline",
      title: t("privacy_settings.analytics"),
      subtitle: t("privacy_settings.analytics_desc"),
      key: "analyticsData" as const,
      value: settings.analyticsData,
    },
    {
      icon: "mail-outline",
      title: t("privacy_settings.marketing_emails"),
      subtitle: t("privacy_settings.marketing_emails_desc"),
      key: "marketingEmails" as const,
      value: settings.marketingEmails,
    },
  ];

  return (
    <ThemedView className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* Privacy Settings */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("privacy_settings.data_control")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {privacyItems.map((item, index) => (
              <View
                key={item.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < privacyItems.length - 1 ? 1 : 0,
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
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-base font-medium">
                    {item.title}
                  </ThemedText>
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {item.subtitle}
                  </ThemedText>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={(value) => updateSetting(item.key, value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                  disabled={loading}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View className="px-4 mb-6">
          <View
            style={{
              padding: 16,
              backgroundColor: colors.primary + "10",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary + "30",
            }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={colors.primary}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View className="flex-1">
                <ThemedText className="text-sm font-medium mb-2">
                  {t("privacy_settings.info_title")}
                </ThemedText>
                <ThemedText className="text-xs opacity-80">
                  {t("privacy_settings.info_desc")}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {!isAuthenticated && (
          <View className="px-4 mb-6">
            <View
              style={{
                padding: 12,
                backgroundColor: colors.warning + "20",
                borderRadius: 8,
              }}
            >
              <ThemedText className="text-sm text-center">
                {t("privacy_settings.guest_warning")}
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}