//  "PaymentMethodSummary.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

export function PaymentMethodSummary() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { state } = useCheckout();
  const { selectedPaymentMethod } = state;
  const { withHapticFeedback } = useHaptics();

  const isBankTransfer = selectedPaymentMethod?.id === "bank_transfer";

  return (
    <Pressable
      onPress={withHapticFeedback(() => {
        if (isBankTransfer) {
          router.push("/checkout/bank-transfer");
        }
      })}
      disabled={!selectedPaymentMethod || !isBankTransfer}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <BaseCard>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons
              name="card-outline"
              size={20}
              color={colors.textSecondary}
            />
            <ThemedText className="font-semibold text-base ml-2">
              {t("checkout.payment_method")}
            </ThemedText>
          </View>
        </View>

        {selectedPaymentMethod ? (
          <View>
            <View className="flex-row items-center">
              <Ionicons
                name={selectedPaymentMethod.icon}
                size={24}
                color={colors.text}
                style={{ marginRight: 12 }}
              />
              <View>
                <ThemedText className="font-semibold">
                  {selectedPaymentMethod.title}
                </ThemedText>
                {selectedPaymentMethod.subtitle && (
                  <ThemedText className="text-sm opacity-60">
                    {selectedPaymentMethod.subtitle}
                  </ThemedText>
                )}
              </View>
            </View>
            {isBankTransfer && (
              <View
                className="flex-row items-center justify-between mt-4 pt-3 border-t"
                style={{ borderTopColor: colors.border + "50" }}
              >
                <ThemedText
                  className="text-xs font-medium"
                  style={{ color: colors.tint }}
                >
                  {t("checkout.view_bank_details_prompt")}
                </ThemedText>
                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.tint}
                />
              </View>
            )}
          </View>
        ) : (
          <ThemedText className="opacity-60">
            {t("checkout.no_payment_method_selected")}
          </ThemedText>
        )}
      </BaseCard>
    </Pressable>
  );
}
