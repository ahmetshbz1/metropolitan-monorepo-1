// "privacy-settings.tsx"
// metropolitan app
// Privacy settings page

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/core/api";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticButton } from "@/components/HapticButton";
import { useNavigationProtection } from "@/hooks/useNavigationProtection";

interface PrivacySettings {
  shareDataWithPartners: boolean;
  analyticsData: boolean;
  marketingEmails: boolean;
}

export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const safeRouter = useNavigationProtection();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { isAuthenticated, isGuest } = useAuth();

  const [settings, setSettings] = useState<PrivacySettings>({
    shareDataWithPartners: true, // Kullanıcı gizlilik politikasını kabul etmişse veri paylaşımını da kabul etmiş sayılır
    analyticsData: true, // Analiz verileri varsayılan olarak açık
    marketingEmails: false, // Pazarlama e-postaları kullanıcının seçimine bağlı
  });
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("privacy_settings.title"),
    });
  }, [navigation, t]);

  // Kullanıcının mevcut gizlilik tercihlerini yükle
  React.useEffect(() => {
    const loadUserPrivacySettings = async () => {
      if (!isAuthenticated) return;

      try {
        // Backend'den kullanıcının mevcut tercihlerini al
        // Bu endpoint henüz implementasyonda yoksa default değerlerle çalış
        const response = await api.get("/users/me/profile");
        const userData = response.data;

        // Backend'deki verilerden gizlilik tercihlerini çıkar
        if (userData) {
          setSettings({
            shareDataWithPartners: userData.privacyAcceptedAt ? true : false,
            analyticsData: userData.privacyAcceptedAt ? true : false,
            marketingEmails: userData.marketingConsent || false,
          });
        }
      } catch (error) {
        console.log(
          "Privacy settings yüklenemedi, default değerler kullanılıyor:",
          error
        );
        // Hata durumunda default değerleri koru
      }
    };

    loadUserPrivacySettings();
  }, [isAuthenticated]);

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (isAuthenticated) {
      setLoading(true);
      try {
        await api.put("/users/user/privacy-settings", newSettings);
        showToast(t("privacy_settings.settings_updated"), "success");
      } catch (error) {
        console.error("Failed to update privacy settings:", error);
        setSettings(settings); // Revert on error
        showToast(t("privacy_settings.update_failed"), "error");
      } finally {
        setLoading(false);
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
        {/* Guest Warning */}
        {isGuest && (
          <View className="px-4 mb-6">
            <View
              style={{
                padding: 16,
                backgroundColor: colors.warning + "10",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.warning + "20",
              }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={colors.warning}
                />
                <ThemedText className="text-base font-semibold ml-2">
                  {t("privacy_settings.guest_title")}
                </ThemedText>
              </View>
              <ThemedText className="text-sm opacity-70">
                {t("privacy_settings.guest_warning")}
              </ThemedText>
              <HapticButton
                className="mt-3"
                onPress={() => safeRouter.push("/(auth)/")}
                debounceDelay={500} // Navigation için debounce
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignSelf: "flex-start",
                }}
              >
                <ThemedText className="text-sm font-medium" style={{ color: "white" }}>
                  {t("profile.login")}
                </ThemedText>
              </HapticButton>
            </View>
          </View>
        )}

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
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={item.value}
                    onValueChange={(value) => updateSetting(item.key, value)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.card}
                    disabled={loading}
                  />
                )}
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

      </ScrollView>
    </ThemedView>
  );
}
