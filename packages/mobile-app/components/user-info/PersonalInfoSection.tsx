//  "PersonalInfoSection.tsx"
//  metropolitan app
//  Created by Ahmet on 02.06.2025.
//  Redesigned on 23.09.2025 for minimal and compact design

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
  const [emailBlurred, setEmailBlurred] = React.useState(false);

  return (
    <View style={{ gap: 12 }}>
      <Text
        className="text-sm font-medium opacity-80 mb-1"
        style={{ color: themeColors.text }}
      >
        {t("user_info.personal_info_section") || "Kişisel Bilgiler"}
      </Text>

      {/* First Name */}
      <BaseInput
        ref={firstNameRef}
        size="small"
        variant="default"
        placeholder={t("user_info.first_name_label")}
        placeholderTextColor={themeColors.mediumGray}
        value={firstName}
        onChangeText={setFirstName}
        returnKeyType="next"
        onSubmitEditing={() => lastNameRef.current?.focus()}
      />

      {/* Last Name */}
      <BaseInput
        ref={lastNameRef}
        size="small"
        variant="default"
        placeholder={t("user_info.last_name_label")}
        placeholderTextColor={themeColors.mediumGray}
        value={lastName}
        onChangeText={setLastName}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />

      {/* Email */}
      <View>
        <BaseInput
          ref={emailRef}
          size="small"
          variant="default"
          placeholder={t("user_info.email_label")}
          placeholderTextColor={themeColors.mediumGray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setEmailBlurred(false)}
          returnKeyType="next"
          onSubmitEditing={() => nipRef.current?.focus()}
          onBlur={() => setEmailBlurred(true)}
          error={emailBlurred && email.trim().length > 0 && !isValidEmail(email) ?
            (t("user_info.email_invalid") || "Geçerli bir e-posta giriniz") : undefined}
        />
      </View>
    </View>
  );
}