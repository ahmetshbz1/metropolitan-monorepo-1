//  "AppSettingsSection.tsx"
//  metropolitan app
//  Created by Ahmet on 11.07.2025.

import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SettingsItem } from "@/components/profile/SettingsItem";
import Colors from "@/constants/Colors";
import { UserSettings } from "@/context/UserSettings";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import { Ionicons } from "@expo/vector-icons";
import ContextMenu from "react-native-context-menu-view";
import { CommunicationPreferencesContent } from "./CommunicationPreferencesContent";

interface AppSettingsSectionProps {
  settings: UserSettings;
  toggleHaptics: (value: boolean) => void;
  toggleTheme: () => void;
  handlePresentModal: (title: string, content: React.ReactNode) => void;
  dismissModal: () => void;
}

export function AppSettingsSection({
  settings,
  toggleHaptics,
  toggleTheme,
  handlePresentModal,
  dismissModal,
}: AppSettingsSectionProps) {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { triggerHaptic } = useHaptics();

  const changeLanguage = (lang: "tr" | "en" | "pl") => {
    triggerHaptic("success");
    i18n.changeLanguage(lang);
  };

  const getCurrentLanguageName = () => {
    switch (i18n.language) {
      case "tr":
        return t("languages.tr");
      case "pl":
        return t("languages.pl");
      case "en":
        return t("languages.en");
      default:
        return t("languages.tr");
    }
  };

  return (
    <View className="w-full">
      <View style={{ marginHorizontal: 16 }}>
        <ThemedView
          className="rounded-2xl"
          style={{
            backgroundColor: colors.cardBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
            paddingHorizontal: 16,
            paddingVertical: 0,
          }}
        >
          <SettingsItem
            icon="color-palette-outline"
            label={t("profile.app_theme")}
            type="toggle"
            value={colorScheme === "dark"}
            onValueChange={toggleTheme}
          />
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 44,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              minHeight: 44,
            }}
          >
            <Ionicons
              name="language-outline"
              size={20}
              color={colors.darkGray}
            />
            <ThemedText className="flex-1 ml-4 text-base">
              {t("profile.app_language")}
            </ThemedText>
            <ContextMenu
              dropdownMenuMode={true}
              actions={[
                {
                  title: t("languages.tr"),
                  selected: i18n.language === "tr",
                },
                {
                  title: t("languages.en"),
                  selected: i18n.language === "en",
                },
                {
                  title: t("languages.pl"),
                  selected: i18n.language === "pl",
                },
              ]}
              onPress={(e) => {
                const languages = ["tr", "en", "pl"] as const;
                const selectedLang = languages[e.nativeEvent.index];
                if (selectedLang) {
                  changeLanguage(selectedLang);
                }
              }}
            >
              <View
                style={{
                  minWidth: 80,
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <ThemedText
                  className="text-base"
                  style={{ color: colors.darkGray, marginRight: 4 }}
                >
                  {getCurrentLanguageName()}
                </ThemedText>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.mediumGray}
                />
              </View>
            </ContextMenu>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 44,
            }}
          />
          <SettingsItem
            icon="phone-portrait-outline"
            label={t("profile.haptics")}
            type="toggle"
            value={settings.hapticsEnabled}
            onValueChange={toggleHaptics}
          />
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 44,
            }}
          />
          <SettingsItem
            icon="chatbubble-ellipses-outline"
            label={t("profile.communication_preferences")}
            type="link"
            onPress={() =>
              handlePresentModal(
                t("profile.communication_preferences"),
                <CommunicationPreferencesContent />
              )
            }
          />
        </ThemedView>
      </View>
    </View>
  );
}
