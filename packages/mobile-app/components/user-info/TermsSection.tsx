//  "TermsSection.tsx"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import { BaseButton } from "@/components/base/BaseButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

interface TermsSectionProps {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingAccepted: boolean;
  onTermsPress: () => void;
  onPrivacyPress: () => void;
  onMarketingPress: () => void;
  themeColors: any;
  t: (key: string) => string;
}

export function TermsSection({
  termsAccepted,
  privacyAccepted,
  marketingAccepted,
  onTermsPress,
  onPrivacyPress,
  onMarketingPress,
  themeColors,
  t,
}: TermsSectionProps) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'tr';

  const handleTermsTextPress = () => {
    const url = `https://metropolitanfg.pl/terms-of-service?lang=${currentLang}`;
    const title = t("user_info.terms_of_service");
    router.push(`/legal-webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
  };

  const handlePrivacyTextPress = () => {
    const url = `https://metropolitanfg.pl/privacy-policy?lang=${currentLang}`;
    const title = t("user_info.privacy_policy");
    router.push(`/legal-webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Terms of Service Checkbox */}
      <BaseButton
        variant="ghost"
        size="small"
        onPress={onTermsPress}
        style={{
          backgroundColor: themeColors.backgroundSecondary,
          borderWidth: 1,
          borderColor: themeColors.border,
          justifyContent: "flex-start",
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View className="flex-row items-start">
          <View className="mr-3 mt-0.5">
            <Ionicons
              name={termsAccepted ? "checkbox" : "square-outline"}
              size={24}
              color={termsAccepted ? themeColors.tint : themeColors.mediumGray}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base leading-6"
              style={{ color: themeColors.text }}
            >
              <Text className="opacity-80">{t("user_info.agree_to")} </Text>
              <Text
                className="font-semibold underline"
                style={{ color: themeColors.tint }}
                onPress={handleTermsTextPress}
              >
                {t("user_info.terms_of_service")}
              </Text>
            </Text>
          </View>
        </View>
      </BaseButton>

      {/* Privacy Policy Checkbox */}
      <BaseButton
        variant="ghost"
        size="small"
        onPress={onPrivacyPress}
        style={{
          backgroundColor: themeColors.backgroundSecondary,
          borderWidth: 1,
          borderColor: themeColors.border,
          justifyContent: "flex-start",
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View className="flex-row items-start">
          <View className="mr-3 mt-0.5">
            <Ionicons
              name={privacyAccepted ? "checkbox" : "square-outline"}
              size={24}
              color={privacyAccepted ? themeColors.tint : themeColors.mediumGray}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base leading-6"
              style={{ color: themeColors.text }}
            >
              <Text className="opacity-80">{t("user_info.agree_to")} </Text>
              <Text
                className="font-semibold underline"
                style={{ color: themeColors.tint }}
                onPress={handlePrivacyTextPress}
              >
                {t("user_info.privacy_policy")}
              </Text>
            </Text>
          </View>
        </View>
      </BaseButton>

      {/* Marketing Communications Checkbox (Optional) */}
      <BaseButton
        variant="ghost"
        size="small"
        onPress={onMarketingPress}
        style={{
          backgroundColor: themeColors.backgroundSecondary,
          borderWidth: 1,
          borderColor: themeColors.border,
          justifyContent: "flex-start",
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View className="flex-row items-start">
          <View className="mr-3 mt-0.5">
            <Ionicons
              name={marketingAccepted ? "checkbox" : "square-outline"}
              size={24}
              color={marketingAccepted ? themeColors.tint : themeColors.mediumGray}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base leading-6"
              style={{ color: themeColors.text }}
            >
              <Text>{t("user_info.marketing_consent")}</Text>
            </Text>
            <Text
              className="text-xs mt-1 opacity-70"
              style={{ color: themeColors.mediumGray }}
            >
              {t("user_info.marketing_consent_desc")}
            </Text>
          </View>
        </View>
      </BaseButton>
    </View>
  );
}
