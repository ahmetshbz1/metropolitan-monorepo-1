//  "PhoneInput.tsx"
//  metropolitan app
//  Created by Ahmet on 14.06.2025.
//  Redesigned on 23.09.2025 for modern minimalist experience with BaseInput

import React, { forwardRef, useRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";
import { BaseInput } from "@/components/base/BaseInput";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { PHONE_INPUT_CONFIG } from "@/utils/phoneFormatters";

interface PhoneInputProps {
  phoneNumber: string;
  countryCode: string;
  countryCodeSelection?: { start: number; end: number };
  onPhoneNumberChange: (text: string) => void;
  onCountryCodeChange: (text: string) => void;
  onCountryCodeFocus: () => void;
  onCountryCodeBlur: () => void;
}

export const PhoneInput = forwardRef<TextInput, PhoneInputProps>(
  (
    {
      phoneNumber,
      countryCode,
      countryCodeSelection,
      onPhoneNumberChange,
      onCountryCodeChange,
      onCountryCodeFocus,
      onCountryCodeBlur,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? "light";
    const themeColors = Colors[colorScheme];
    const countryCodeRef = useRef<TextInput>(null);
    const phoneNumberRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => phoneNumberRef.current!);

    return (
      <>
        <Text
          className="text-sm font-medium opacity-80 mb-1"
          style={{ color: themeColors.text }}
        >
          {t("phone_login.phone_number_label")}
        </Text>
        <View className="flex-row" style={{ gap: 12 }}>
          <View style={{ width: 90 }}>
            <BaseInput
              ref={countryCodeRef}
              size="small"
              variant="default"
              placeholder="+48"
              placeholderTextColor={themeColors.mediumGray}
              value={`+${countryCode}`}
              onChangeText={(text) => {
                const cleaned = text.replace(/\+/g, '');
                onCountryCodeChange(cleaned);
              }}
              keyboardType="numeric"
              maxLength={PHONE_INPUT_CONFIG.maxCountryCodeLength + 1}
              onFocus={onCountryCodeFocus}
              onBlur={onCountryCodeBlur}
              inputStyle={{ textAlign: 'center', fontWeight: '500' }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <BaseInput
              ref={phoneNumberRef}
              size="small"
              variant="default"
              placeholder={PHONE_INPUT_CONFIG.placeholder}
              placeholderTextColor={themeColors.mediumGray}
              value={phoneNumber}
              onChangeText={onPhoneNumberChange}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              autoFocus={true}
            />
          </View>
        </View>
      </>
    );
  }
);

PhoneInput.displayName = "PhoneInput";