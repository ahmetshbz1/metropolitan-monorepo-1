//  "LegalSection.tsx"
//  metropolitan app
//  Created by Ahmet on 22.09.2025.

import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SettingsItem } from "./SettingsItem";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export function LegalSection() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const currentLang = i18n.language || 'tr';

  const openPrivacyPolicy = () => {
    const url = `https://metropolitanfg.pl/privacy-policy?lang=${currentLang}`;
    router.push({
      pathname: "/legal-webview",
      params: {
        url,
        title: t("profile.privacy_policy"),
      },
    });
  };

  const openTermsOfService = () => {
    const url = `https://metropolitanfg.pl/terms-of-service?lang=${currentLang}`;
    router.push({
      pathname: "/legal-webview",
      params: {
        url,
        title: t("profile.terms_of_service"),
      },
    });
  };

  return (
    <View className="w-full">
      <View style={{ marginHorizontal: 16 }}>
        <ThemedText className="text-base font-semibold mb-3">
          {t("profile.legal_section_title")}
        </ThemedText>
      </View>
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
            icon="shield-checkmark-outline"
            label={t("profile.privacy_policy")}
            type="link"
            onPress={openPrivacyPolicy}
          />
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 44,
            }}
          />
          <SettingsItem
            icon="document-text-outline"
            label={t("profile.terms_of_service")}
            type="link"
            onPress={openTermsOfService}
          />
        </ThemedView>
      </View>
    </View>
  );
}