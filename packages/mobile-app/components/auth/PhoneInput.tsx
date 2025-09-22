//  "PhoneInput.tsx"
//  metropolitan app
//  Created by Ahmet on 14.06.2025.
//  Redesigned on 23.09.2025 for modern minimalist experience

import React, { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";
import { zincColors } from "@/constants/colors/zincColors";
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
    const isDark = colorScheme === "dark";
    const themeColors = Colors[colorScheme];

    return (
      <>
        <Text
          className="mb-2 text-sm font-medium"
          style={{ color: themeColors.text, opacity: 0.7 }}
        >
          {t("phone_login.phone_number_label")}
        </Text>
        <View
          className="h-14 flex-row items-center rounded-2xl"
          style={{
            backgroundColor: isDark ? zincColors[900] : zincColors[100],
          }}
        >
          <View className="flex-row items-center px-4">
            <Text
              className="text-base font-medium mr-1"
              style={{ color: themeColors.text }}
            >
              +
            </Text>
            <TextInput
              style={{
                fontSize: 16,
                color: themeColors.text,
                width: 50,
                fontWeight: "500",
              }}
              placeholderTextColor={isDark ? zincColors[500] : zincColors[400]}
              keyboardType="numeric"
              value={countryCode}
              onChangeText={onCountryCodeChange}
              maxLength={PHONE_INPUT_CONFIG.maxCountryCodeLength}
              onFocus={onCountryCodeFocus}
              onBlur={onCountryCodeBlur}
              selection={countryCodeSelection}
            />
          </View>

          <View
            style={{
              width: 1,
              height: "50%",
              backgroundColor: isDark ? zincColors[700] : zincColors[300],
            }}
          />

          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: themeColors.text,
              paddingHorizontal: 16,
              height: "100%",
            }}
            placeholder={PHONE_INPUT_CONFIG.placeholder}
            placeholderTextColor={isDark ? zincColors[500] : zincColors[400]}
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