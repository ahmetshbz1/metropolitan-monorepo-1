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
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/core/utils";
import { useColorScheme } from "@/hooks/useColorScheme";

export function OrderTotals() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { summary } = useCart();
  const { user } = useAuth();

  if (!summary) {
    return null;
  }

  const MINIMUM_ORDER_AMOUNT = 200;
  const isIndividual = user?.userType === "individual";
  const isBelowMinimum = isIndividual && summary.totalAmount < MINIMUM_ORDER_AMOUNT;
  const remainingAmount = MINIMUM_ORDER_AMOUNT - summary.totalAmount;

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

      {isBelowMinimum && (
        <View
          className="flex-row items-start mb-3 p-3 rounded-xl"
          style={{ backgroundColor: colors.error + "15" }}
        >
          <Ionicons
            name="alert-circle"
            size={20}
            color={colors.error}
            style={{ marginRight: 8, marginTop: 2 }}
          />
          <View className="flex-1">
            <ThemedText
              className="text-sm font-semibold mb-1"
              style={{ color: colors.error }}
            >
              {t("checkout.minimum_order_title")}
            </ThemedText>
            <ThemedText
              className="text-xs"
              style={{ color: colors.error, opacity: 0.9 }}
            >
              {t("checkout.minimum_order_message", {
                amount: formatPrice(remainingAmount, summary.currency),
              })}
            </ThemedText>
          </View>
        </View>
      )}

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
