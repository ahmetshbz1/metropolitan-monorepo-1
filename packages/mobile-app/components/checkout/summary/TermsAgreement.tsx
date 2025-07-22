//  "TermsAgreement.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import React from "react";
import { useTranslation } from "react-i18next";
import { Switch, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export function TermsAgreement() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { state, setAgreedToTerms } = useCheckout();

  return (
    <View className="flex-row items-center justify-between p-2">
      <View className="flex-1 pr-4">
        <ThemedText className="text-sm opacity-80">
          {t("checkout.agree_terms")}
        </ThemedText>
      </View>
      <Switch
        value={state.agreedToTerms}
        onValueChange={setAgreedToTerms}
        trackColor={{ false: "#767577", true: colors.tint }}
        thumbColor={"#f4f3f4"}
      />
    </View>
  );
}
