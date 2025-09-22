//  "TermsSection.tsx"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.
//  Redesigned on 23.09.2025 for minimal and compact design

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
    <View style={{ gap: 10 }}>
      {/* Terms of Service Checkbox */}
      <TouchableOpacity
        onPress={onTermsPress}
        activeOpacity={0.7}
        className="flex-row items-center py-2.5"
      >
        <Ionicons
          name={termsAccepted ? "checkbox" : "square-outline"}
          size={21}
          color={termsAccepted ? themeColors.tint : themeColors.mediumGray}
          style={{ marginRight: 11 }}
        />
        <Text
          className="text-sm flex-1"
          style={{ color: themeColors.text, fontSize: 15 }}
        >
          <Text style={{ opacity: 0.8 }}>{t("user_info.agree_to")} </Text>
          <Text
            className="font-medium"
            style={{ color: themeColors.tint }}
            onPress={handleTermsTextPress}
          >
            {t("user_info.terms_of_service")}
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Privacy Policy Checkbox */}
      <TouchableOpacity
        onPress={onPrivacyPress}
        activeOpacity={0.7}
        className="flex-row items-center py-2.5"
      >
        <Ionicons
          name={privacyAccepted ? "checkbox" : "square-outline"}
          size={21}
          color={privacyAccepted ? themeColors.tint : themeColors.mediumGray}
          style={{ marginRight: 11 }}
        />
        <Text
          className="text-sm flex-1"
          style={{ color: themeColors.text, fontSize: 15 }}
        >
          <Text style={{ opacity: 0.8 }}>{t("user_info.agree_to")} </Text>
          <Text
            className="font-medium"
            style={{ color: themeColors.tint }}
            onPress={handlePrivacyTextPress}
          >
            {t("user_info.privacy_policy")}
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Marketing Communications Checkbox (Optional) */}
      <TouchableOpacity
        onPress={onMarketingPress}
        activeOpacity={0.7}
        className="flex-row items-start py-2.5"
      >
        <Ionicons
          name={marketingAccepted ? "checkbox" : "square-outline"}
          size={21}
          color={marketingAccepted ? themeColors.tint : themeColors.mediumGray}
          style={{ marginRight: 11, marginTop: 1 }}
        />
        <View className="flex-1">
          <Text
            className="text-sm"
            style={{ color: themeColors.text, fontSize: 15 }}
          >
            {t("user_info.marketing_consent")}
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: themeColors.mediumGray, opacity: 0.7, fontSize: 13 }}
          >
            {t("user_info.marketing_consent_desc")}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}