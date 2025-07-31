//  "PhoneInput.tsx"
//  metropolitan app
//  Created by Ahmet on 14.06.2025.

import React, { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";

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

    return (
      <>
        <Text
          className="mb-1 pl-2.5 text-base font-medium opacity-80"
          style={{ color: themeColors.text }}
        >
          {t("phone_login.phone_number_label")}
        </Text>
        <View
          className="h-14 flex-row items-center rounded-xl px-4"
          style={{
            backgroundColor:
              colorScheme === "light"
                ? themeColors.card
                : themeColors.backgroundSecondary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <Text
            className="text-lg font-semibold"
            style={{ color: themeColors.text }}
          >
            +
          </Text>
          <TextInput
            style={{
              paddingHorizontal: 4,
              fontSize: 17,
              color: themeColors.text,
              width: 60,
            }}
            placeholderTextColor={themeColors.mediumGray}
            keyboardType="numeric"
            value={countryCode}
            onChangeText={onCountryCodeChange}
            maxLength={PHONE_INPUT_CONFIG.maxCountryCodeLength}
            onFocus={onCountryCodeFocus}
            onBlur={onCountryCodeBlur}
            selection={countryCodeSelection}
          />
          <View
            style={{
              width: 1,
              height: "60%",
              backgroundColor: themeColors.border,
              marginHorizontal: 8,
            }}
          />
          <TextInput
            style={{
              flex: 1,
              fontSize: 17,
              color: themeColors.text,
            }}
            placeholder={PHONE_INPUT_CONFIG.placeholder}
            placeholderTextColor={themeColors.mediumGray}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={onPhoneNumberChange}
            textContentType="telephoneNumber"
            autoComplete="tel"
            autoFocus={true}
            ref={ref}
          />
        </View>
      </>
    );
  }
);
PhoneInput.displayName = "PhoneInput";
