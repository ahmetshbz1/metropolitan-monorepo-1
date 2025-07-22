//  "SupportSection.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025.

import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ContactInfoSection } from "@/components/profile/ContactInfoSection";
import { SettingsItem } from "@/components/profile/SettingsItem";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface SupportSectionProps {
  handlePresentModal: (
    title: string,
    content: ReactNode,
    snapPoints?: string[]
  ) => void;
}

export function SupportSection({ handlePresentModal }: SupportSectionProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  // const helpContent = (
  //   <ThemedText>
  //     {t('profile.help.content')}
  //   </ThemedText>
  // );

  // const faqContent = (
  //   <ThemedText>
  //     {t('profile.faq.content')}
  //   </ThemedText>
  // );

  return (
    <View className="w-full">
      <View style={{ marginHorizontal: 16 }}>
        <ThemedText className="text-base font-semibold mb-3">
          {t("profile.support_section_title")}
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
            icon="help-circle-outline"
            label={t("profile.help_center")}
            type="link"
            onPress={() => router.push("/help-center")}
          />
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 44,
            }}
          />
          <SettingsItem
            icon="call-outline"
            label={t("profile.contact_us")}
            type="link"
            onPress={() =>
              handlePresentModal(
                t("profile.contact_us"),
                <ContactInfoSection />
              )
            }
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
            label={t("profile.faq.title")}
            type="link"
            onPress={() => router.push("/faq")}
          />
        </ThemedView>
      </View>
    </View>
  );
}
