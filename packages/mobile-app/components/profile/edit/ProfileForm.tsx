//  "ProfileForm.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { isValidEmail } from "@/utils/validation";

interface ProfileFormProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  emailBlurred: boolean;
  setEmailBlurred: (value: boolean) => void;
}

export function ProfileForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  emailBlurred,
  setEmailBlurred,
}: ProfileFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const textInputStyle = {
    backgroundColor: colors.card,
    color: colors.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    textAlignVertical: "center" as const,
    paddingVertical: 0,
    includeFontPadding: false,
    lineHeight: 18,
  };

  return (
    <View>
      <ThemedText className="text-base mb-1 font-medium opacity-80">
        {t("edit_profile.first_name")}
      </ThemedText>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        className="h-14 rounded-xl px-4 text-base mb-4"
        style={textInputStyle}
        placeholder={t("edit_profile.first_name_placeholder")}
        placeholderTextColor={colors.mediumGray}
      />

      <ThemedText className="text-base mb-1 font-medium opacity-80">
        {t("edit_profile.last_name")}
      </ThemedText>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        className="h-14 rounded-xl px-4 text-base mb-4"
        style={textInputStyle}
        placeholder={t("edit_profile.last_name_placeholder")}
        placeholderTextColor={colors.mediumGray}
      />

      <ThemedText className="text-base mb-1 font-medium opacity-80">
        {t("edit_profile.email")}
      </ThemedText>
      <TextInput
        value={email}
        onChangeText={setEmail}
        className="h-14 rounded-xl px-4 text-base mb-4"
        style={textInputStyle}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder={t("edit_profile.email_placeholder")}
        placeholderTextColor={colors.mediumGray}
        onFocus={() => setEmailBlurred(false)}
        onBlur={() => setEmailBlurred(true)}
      />

      {emailBlurred && email.trim().length > 0 && !isValidEmail(email) && (
        <ThemedText
          className="text-sm mb-4"
          style={{ color: colors.danger }}
        >
          {t("edit_profile.email_invalid")}
        </ThemedText>
      )}

      <ThemedText className="text-base mb-1 font-medium opacity-80">
        {t("edit_profile.phone_number")}
      </ThemedText>
      <TextInput
        value={user?.phone || ""}
        editable={false}
        className="h-14 rounded-xl px-4 text-base mb-4"
        style={[textInputStyle, { color: colors.mediumGray }]}
        placeholder={t("edit_profile.phone_number_placeholder")}
        placeholderTextColor={colors.mediumGray}
        keyboardType="phone-pad"
        selectTextOnFocus={false}
        accessible
        accessibilityLabel={t("edit_profile.phone_number")}
      />
    </View>
  );
}
