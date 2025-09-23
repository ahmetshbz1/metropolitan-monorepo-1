//  "ProfileForm.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
//  Updated on 23.09.2025 to use BaseInput

import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BaseInput } from "@/components/base/BaseInput";
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

  return (
    <View style={{ gap: 12 }}>
      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("edit_profile.first_name")}
        </ThemedText>
        <BaseInput
          value={firstName}
          onChangeText={setFirstName}
          size="small"
          variant="default"
          placeholder={t("edit_profile.first_name_placeholder")}
          placeholderTextColor={colors.mediumGray}
        />
      </View>

      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("edit_profile.last_name")}
        </ThemedText>
        <BaseInput
          value={lastName}
          onChangeText={setLastName}
          size="small"
          variant="default"
          placeholder={t("edit_profile.last_name_placeholder")}
          placeholderTextColor={colors.mediumGray}
        />
      </View>

      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("edit_profile.email")}
        </ThemedText>
        <BaseInput
          value={email}
          onChangeText={setEmail}
          size="small"
          variant="default"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder={t("edit_profile.email_placeholder")}
          placeholderTextColor={colors.mediumGray}
          onFocus={() => setEmailBlurred(false)}
          onBlur={() => setEmailBlurred(true)}
          error={emailBlurred && email.trim().length > 0 && !isValidEmail(email)
            ? t("edit_profile.email_invalid")
            : undefined}
        />
      </View>

      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("edit_profile.phone_number")}
        </ThemedText>
        <BaseInput
          value={user?.phone || ""}
          editable={false}
          disabled
          size="small"
          variant="default"
          placeholder={t("edit_profile.phone_number_placeholder")}
          placeholderTextColor={colors.mediumGray}
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );
}