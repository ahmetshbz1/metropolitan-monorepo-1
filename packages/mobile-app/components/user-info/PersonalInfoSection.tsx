//  "PersonalInfoSection.tsx"
//  metropolitan app
//  Created by Ahmet on 02.06.2025.

import { BaseInput } from "@/components/base/BaseInput";
import { isValidEmail } from "@/utils/validation";
import React from "react";
import { Text, TextInput, View } from "react-native";

interface PersonalInfoSectionProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  firstNameRef: React.RefObject<TextInput | null>;
  lastNameRef: React.RefObject<TextInput | null>;
  emailRef: React.RefObject<TextInput | null>;
  nipRef: React.RefObject<TextInput | null>;
  themeColors: any;
  t: (key: string) => string;
}

export function PersonalInfoSection({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  firstNameRef,
  lastNameRef,
  emailRef,
  nipRef,
  themeColors,
  t,
}: PersonalInfoSectionProps) {
  // Show email validation error only after the user has finished editing (i.e., onBlur)
  const [emailBlurred, setEmailBlurred] = React.useState(false);
  return (
    <View className="mb-6">
      <Text
        className="text-lg font-semibold mb-4 opacity-90"
        style={{ color: themeColors.text }}
      >
        {t("user_info.personal_info_section") || "Kişisel Bilgiler"}
      </Text>

      {/* First Name */}
      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2 pl-1 opacity-80"
          style={{ color: themeColors.text }}
        >
          {t("user_info.first_name_label")}
        </Text>
        <BaseInput
          ref={firstNameRef}
          size="small"
          placeholder={t("user_info.first_name_placeholder")}
          placeholderTextColor={themeColors.mediumGray}
          value={firstName}
          onChangeText={setFirstName}
          returnKeyType="next"
          onSubmitEditing={() => {
            lastNameRef.current?.focus();
          }}
        />
      </View>

      {/* Last Name */}
      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2 pl-1 opacity-80"
          style={{ color: themeColors.text }}
        >
          {t("user_info.last_name_label")}
        </Text>
        <BaseInput
          ref={lastNameRef}
          size="small"
          placeholder={t("user_info.last_name_placeholder")}
          placeholderTextColor={themeColors.mediumGray}
          value={lastName}
          onChangeText={setLastName}
          returnKeyType="next"
          onSubmitEditing={() => {
            emailRef.current?.focus();
          }}
        />
      </View>

      {/* Email */}
      <View className="mb-6">
        <Text
          className="text-sm font-medium mb-2 pl-1 opacity-80"
          style={{ color: themeColors.text }}
        >
          {t("user_info.email_label")}
        </Text>
        <BaseInput
          ref={emailRef}
          size="small"
          placeholder={t("user_info.email_placeholder")}
          placeholderTextColor={themeColors.mediumGray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => {
            setEmailBlurred(false);
          }}
          returnKeyType="next"
          onSubmitEditing={() => {
            nipRef.current?.focus();
          }}
          onBlur={() => setEmailBlurred(true)}
        />
        {emailBlurred && email.trim().length > 0 && !isValidEmail(email) && (
          <Text className="mt-2 text-sm" style={{ color: themeColors.danger }}>
            {t("user_info.email_invalid") || "Geçerli bir e-posta giriniz"}
          </Text>
        )}
      </View>
    </View>
  );
}
