//  "LogoutButton.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export function LogoutButton() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleLogout = () => {
    Alert.alert(
      t("profile.logout_alert_title"),
      t("profile.logout_alert_message"),
      [
        { text: t("profile.logout_alert_cancel"), style: "cancel" },
        {
          text: t("profile.logout_alert_confirm"),
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  return (
    <HapticButton
      className="flex-row items-center justify-center mx-5 mt-5 p-4 rounded-2xl"
      style={{ backgroundColor: colors.danger + "10" }}
      onPress={handleLogout}
      hapticType="warning"
      accessibilityRole="button"
      accessibilityLabel={t("profile.logout")}
    >
      <Ionicons name="log-out-outline" size={22} color={colors.danger} />
      <ThemedText
        className="font-semibold ml-2.5"
        style={{ color: colors.danger }}
      >
        {t("profile.logout")}
      </ThemedText>
    </HapticButton>
  );
}
