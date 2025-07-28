//  "HelpContent.tsx"
//  metropolitan app
//  Created by Ahmet on 12.06.2025.

import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

const supportEmail = "destek@metropolitan.com";
const supportPhone = "+48123456789";

interface HelpContentProps {
  infoText: string;
  address?: {
    title: string;
    value: string;
  };
  showSocialMedia?: boolean;
}

const ContactButton = ({
  icon,
  label,
  value,
  onPress,
}: {
  icon: any;
  label: string;
  value: string;
  onPress: () => void;
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      className="flex-row items-center p-4 rounded-xl mb-4"
      style={{
        backgroundColor: colors.cardBackground,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={24} color={colors.tint} />
      <View className="flex-1 ml-4">
        <ThemedText className="text-base font-semibold mb-0.5">
          {label}
        </ThemedText>
        <ThemedText
          className="text-sm font-medium"
          style={{ color: colors.tint }}
        >
          {value}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.darkGray} />
    </TouchableOpacity>
  );
};

export function HelpContent({
  infoText,
  address,
  showSocialMedia,
}: HelpContentProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { triggerHaptic } = useHaptics();
  const { t } = useTranslation();

  const handleContactPress = (type: "email" | "phone") => {
    triggerHaptic("light");
    if (type === "email") {
      Linking.openURL(`mailto:${supportEmail}`);
    } else {
      Linking.openURL(`tel:${supportPhone}`);
    }
  };

  return (
    <View className="px-1 pt-2.5">
      <ThemedText 
        className="text-sm leading-6 text-center mb-5"
        style={{ color: colors.textSecondary }}
      >
        {infoText}
      </ThemedText>

      <ContactButton
        icon="mail-outline"
        label={t("profile.help.send_email")}
        value={supportEmail}
        onPress={() => handleContactPress("email")}
      />
      <ContactButton
        icon="call-outline"
        label={t("profile.help.call_us")}
        value={supportPhone}
        onPress={() => handleContactPress("phone")}
      />

      {address && (
        <View
          className="flex-row items-center p-4 rounded-xl"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <Ionicons name="location-outline" size={24} color={colors.tint} />
          <View className="flex-1 ml-4">
            <ThemedText className="text-base font-semibold mb-0.5">
              {address.title}
            </ThemedText>
            <ThemedText
              className="text-sm font-medium"
              style={{ color: colors.tint }}
            >
              {address.value}
            </ThemedText>
          </View>
        </View>
      )}

      {showSocialMedia && (
        <>
          <View
            className="my-5 mx-4"
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: colors.border,
            }}
          />
          <ThemedText className="text-base font-semibold text-center mb-5">
            {t("profile.help.social_media_title")}
          </ThemedText>
          <View className="flex-row justify-around items-center">
            <Ionicons name="logo-instagram" size={30} color={colors.darkGray} />
            <Ionicons name="logo-facebook" size={30} color={colors.darkGray} />
            <Ionicons name="logo-twitter" size={30} color={colors.darkGray} />
            <Ionicons name="logo-linkedin" size={30} color={colors.darkGray} />
          </View>
        </>
      )}
    </View>
  );
}
