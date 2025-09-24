// "app-settings.tsx"
// metropolitan app
// Application settings page

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAppColorScheme } from "@/context/ColorSchemeContext";
import { useUserSettings } from "@/context/UserSettings";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticButton } from "@/components/HapticButton";
import { useRouter } from "expo-router";
import ContextMenu from "react-native-context-menu-view";

export default function AppSettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { toggleTheme } = useAppColorScheme();
  const { settings, updateSettings } = useUserSettings();

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("profile.app_settings"),
    });
  }, [navigation, t]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    updateSettings({ language: lang });
  };

  const languages = [
    { code: "tr", name: "Türkçe" },
    { code: "en", name: "English" },
    { code: "pl", name: "Polski" },
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <ThemedView className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* Appearance Section */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("app_settings.appearance")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {/* Dark Mode Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
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
                  name={colorScheme === "dark" ? "moon" : "sunny"}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1">
                <ThemedText className="text-base font-medium">
                  {t("app_settings.dark_mode")}
                </ThemedText>
                <ThemedText className="text-xs opacity-60 mt-1">
                  {t("app_settings.dark_mode_desc")}
                </ThemedText>
              </View>
              <Switch
                value={colorScheme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>

            {/* Language Selector */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
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
                  name="language-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1">
                <ThemedText className="text-base font-medium">
                  {t("app_settings.language")}
                </ThemedText>
                <ThemedText className="text-xs opacity-60 mt-1">
                  {t("app_settings.language_desc")}
                </ThemedText>
              </View>
              <ContextMenu
                dropdownMenuMode={true}
                actions={languages.map(lang => ({
                  title: lang.name,
                  selected: i18n.language === lang.code,
                }))}
                onPress={(e) => {
                  const selectedLang = languages[e.nativeEvent.index];
                  if (selectedLang) {
                    handleLanguageChange(selectedLang.code);
                  }
                }}
              >
                <View
                  style={{
                    minWidth: 100,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ThemedText
                    className="text-sm font-medium"
                    style={{ color: colors.text, marginRight: 4 }}
                  >
                    {currentLanguage.name}
                  </ThemedText>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.mediumGray}
                  />
                </View>
              </ContextMenu>
            </View>
          </View>
        </View>

        {/* Interaction Section */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("app_settings.interaction")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {/* Haptic Feedback Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
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
                  name="phone-portrait-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1">
                <ThemedText className="text-base font-medium">
                  {t("app_settings.haptic_feedback")}
                </ThemedText>
                <ThemedText className="text-xs opacity-60 mt-1">
                  {t("app_settings.haptic_feedback_desc")}
                </ThemedText>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(value) => updateSettings({ hapticsEnabled: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("app_settings.notifications")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <HapticButton
              onPress={() => router.push("/notification-settings")}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
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
                  name="notifications-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1">
                <ThemedText className="text-base font-medium">
                  {t("app_settings.notification_preferences")}
                </ThemedText>
                <ThemedText className="text-xs opacity-60 mt-1">
                  {t("app_settings.notification_preferences_desc")}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mediumGray}
              />
            </HapticButton>
          </View>
        </View>

        {/* Cache Section */}
        <View className="px-4 mb-6">
          <ThemedText className="text-sm font-semibold mb-3 opacity-60 uppercase">
            {t("app_settings.storage")}
          </ThemedText>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <HapticButton
              onPress={() => {
                // Clear cache logic here
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
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
                  name="trash-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1">
                <ThemedText className="text-base font-medium">
                  {t("app_settings.clear_cache")}
                </ThemedText>
                <ThemedText className="text-xs opacity-60 mt-1">
                  {t("app_settings.clear_cache_desc")}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mediumGray}
              />
            </HapticButton>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}