//  "CommunicationPreferencesContent.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const PreferenceItem = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      className="flex-row justify-between items-center py-4"
      style={{
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}
    >
      <ThemedText className="text-lg">{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#dcdcdc", true: "#4CD964" }}
        thumbColor={value ? "#FFFFFF" : "#f4f3f4"}
        ios_backgroundColor="#dcdcdc"
      />
    </View>
  );
};

export function CommunicationPreferencesContent() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  return (
    <View className="px-2 pt-2">
      <ThemedText
        className="mb-5 text-sm leading-5 text-center"
        style={{ color: colors.textSecondary }}
      >
        {t("profile.communication_preferences_description")}
      </ThemedText>
      <PreferenceItem
        label={t("profile.push_notifications")}
        value={pushNotifications}
        onValueChange={setPushNotifications}
      />
      <PreferenceItem
        label={t("profile.email_notifications")}
        value={emailNotifications}
        onValueChange={setEmailNotifications}
      />
      <PreferenceItem
        label={t("profile.sms_notifications")}
        value={smsNotifications}
        onValueChange={setSmsNotifications}
      />
    </View>
  );
}
