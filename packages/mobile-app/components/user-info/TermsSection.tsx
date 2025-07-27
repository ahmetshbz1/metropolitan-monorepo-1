//  "TermsSection.tsx"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import { BaseButton } from "@/components/base/BaseButton";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface TermsSectionProps {
  termsAccepted: boolean;
  onPress: () => void;
  themeColors: any;
  t: (key: string) => string;
}

export function TermsSection({
  termsAccepted,
  onPress,
  themeColors,
  t,
}: TermsSectionProps) {
  return (
    <View>
      <BaseButton
        variant="ghost"
        size="small"
        onPress={onPress}
        style={{
          backgroundColor: themeColors.backgroundSecondary,
          borderWidth: 1,
          borderColor: themeColors.border,
          justifyContent: "flex-start",
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View className="flex-row items-start">
          <View className="mr-3 mt-0.5">
            <Ionicons
              name={termsAccepted ? "checkbox" : "square-outline"}
              size={24}
              color={termsAccepted ? themeColors.tint : themeColors.mediumGray}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base leading-6"
              style={{ color: themeColors.text }}
            >
              <Text className="opacity-80">{t("user_info.agree_to_the")} </Text>
              <Text
                className="font-semibold underline"
                style={{ color: themeColors.tint }}
              >
                {t("user_info.terms_and_policy")}
              </Text>
            </Text>
          </View>
        </View>
      </BaseButton>
    </View>
  );
}
