// "app-settings.tsx"
// metropolitan app
// Application settings page

import ClearCacheSheet from "@/components/ClearCacheSheet";
import { HapticButton } from "@/components/HapticButton";
import NotificationPreferencesSheet, {
  NotificationPreferencesSheetRef,
} from "@/components/NotificationPreferencesSheet";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAppColorScheme } from "@/context/ColorSchemeContext";
import { useUserSettings } from "@/context/UserSettings";
import { changeLanguage } from "@/core/i18n";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useRef, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch, View } from "react-native";
import ContextMenu from "react-native-context-menu-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppSettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { setTheme, currentThemeSetting } = useAppColorScheme();
  const [, startTransition] = useTransition();
  const { settings, updateSettings } = useUserSettings();
  const notificationSheetRef = useRef<NotificationPreferencesSheetRef>(null);
  const clearCacheSheetRef = useRef<BottomSheetModal>(null);

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("app_settings.title"),
    });
  }, [navigation, t]);

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang as "tr" | "en" | "pl");
  };

  const languages = [
    { code: "tr", name: "Türkçe" },
    { code: "en", name: "English" },
    { code: "pl", name: "Polski" },
  ];

  const themes = [
    {
      code: "system",
      name: t("app_settings.theme_system"),
      icon: "phone-portrait-outline",
    },
    {
      code: "light",
      name: t("app_settings.theme_light"),
      icon: "sunny-outline",
    },
    { code: "dark", name: t("app_settings.theme_dark"), icon: "moon-outline" },
  ];

  const currentTheme =
    themes.find((t) => t.code === currentThemeSetting) || themes[0];

  const currentLanguage =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const clearCache = () => {
    clearCacheSheetRef.current?.present();
  };

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
            {/* Theme Selector */}
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
                  name={currentTheme.icon as any}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1">
                <ThemedText className="text-base font-medium">
                  {t("app_settings.theme")}
                </ThemedText>
                <ThemedText className="text-xs opacity-60 mt-1">
                  {t("app_settings.theme_desc")}
                </ThemedText>
              </View>
              <ContextMenu
                dropdownMenuMode={true}
                actions={themes.map((theme) => ({
                  title: theme.name,
                  selected: currentThemeSetting === theme.code,
                }))}
                onPress={(e) => {
                  const selectedTheme = themes[e.nativeEvent.index];
                  if (selectedTheme) {
                    startTransition(() => {
                      setTheme(selectedTheme.code as "light" | "dark" | "system");
                    });
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
                    {currentTheme.name}
                  </ThemedText>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.mediumGray}
                  />
                </View>
              </ContextMenu>
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
                actions={languages.map((lang) => ({
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
                onValueChange={(value) =>
                  updateSettings({ hapticsEnabled: value })
                }
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
              onPress={() => notificationSheetRef.current?.present()}
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
              onPress={clearCache}
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
      <NotificationPreferencesSheet ref={notificationSheetRef} />
      <ClearCacheSheet ref={clearCacheSheetRef} />
    </ThemedView>
  );
}
