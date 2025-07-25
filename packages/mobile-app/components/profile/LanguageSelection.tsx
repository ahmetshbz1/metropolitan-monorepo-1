//  "LanguageSelection.tsx"
//  metropolitan app
//  Created by Ahmet on 02.07.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { changeLanguage } from "@/core/i18n";
import { useColorScheme } from "@/hooks/useColorScheme";

type Language = "tr" | "pl" | "en";
type LanguageKey = "languages.tr" | "languages.pl" | "languages.en";

const LANGUAGES: { code: Language; nameKey: LanguageKey }[] = [
  { code: "tr", nameKey: "languages.tr" },
  { code: "pl", nameKey: "languages.pl" },
  { code: "en", nameKey: "languages.en" },
];

export function LanguageSelection({ onClose }: { onClose: () => void }) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  // const { triggerHaptic } = useHaptics();
  const { i18n, t } = useTranslation();

  const handleLanguageChange = async (lang: "tr" | "en" | "pl") => {
    await changeLanguage(lang);
    onClose();
  };

  const selectedLanguage = i18n.language;

  return (
    <View className="pt-2.5">
      {LANGUAGES.map((lang, index) => (
        <React.Fragment key={lang.code}>
          <TouchableOpacity
            className="flex-row justify-between items-center py-4 px-2.5"
            onPress={() => handleLanguageChange(lang.code)}
          >
            <ThemedText className="text-base">{t(lang.nameKey)}</ThemedText>
            {selectedLanguage === lang.code && (
              <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
            )}
          </TouchableOpacity>
          {index < LANGUAGES.length - 1 && (
            <View
              className="mx-2.5"
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.border,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
