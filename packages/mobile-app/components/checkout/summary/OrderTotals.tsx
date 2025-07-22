//  "OrderTotals.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/core/utils";
import { useColorScheme } from "@/hooks/useColorScheme";

export function OrderTotals() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { summary } = useCart();

  if (!summary) {
    return null;
  }

  return (
    <BaseCard>
      <View className="flex-row items-center mb-3">
        <Ionicons
          name="receipt-outline"
          size={20}
          color={colors.textSecondary}
        />
        <ThemedText className="font-semibold text-base ml-2">
          {t("checkout.order_summary")}
        </ThemedText>
      </View>
      <View className="gap-y-2">
        <View className="flex-row justify-between items-center">
          <ThemedText className="opacity-80">
            {t("checkout.subtotal")} ({summary.totalItems}{" "}
            {t("checkout.items")})
          </ThemedText>
          <ThemedText className="font-medium">
            {formatPrice(summary.totalAmount, summary.currency)}
          </ThemedText>
        </View>
        <View className="flex-row justify-between items-center">
          <ThemedText className="opacity-80">
            {t("checkout.shipping")}
          </ThemedText>
          <ThemedText className="font-medium text-green-600">
            {t("checkout.free")}
          </ThemedText>
        </View>
        <View
          className="my-1"
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border + "50",
          }}
        />
        <View className="flex-row justify-between items-center">
          <ThemedText className="font-bold text-lg">
            {t("checkout.total")}
          </ThemedText>
          <ThemedText className="font-bold text-lg">
            {formatPrice(summary.totalAmount, summary.currency)}
          </ThemedText>
        </View>
      </View>
    </BaseCard>
  );
}
