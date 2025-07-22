//  "SummarySection.tsx"
//  metropolitan app
//  Created by Ahmet on 05.06.2025.

import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { OrderDetail } from "@/context/OrderContext";
import { formatPrice } from "@/core/utils";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface SummarySectionProps {
  order: OrderDetail;
}

export function SummarySection({ order }: SummarySectionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  return (
    <BaseCard>
      <ThemedText className="text-lg font-semibold mb-4">
        {t("order_detail.summary.section_title")}
      </ThemedText>
      <View className="flex-row justify-between mb-2">
        <ThemedText className="text-base opacity-70">
          {t("order_detail.summary.subtotal")}
        </ThemedText>
        <ThemedText className="text-base">
          {formatPrice(order.totalAmount, order.currency)}
        </ThemedText>
      </View>
      <View className="flex-row justify-between mb-2">
        <ThemedText className="text-base opacity-70">
          {t("order_detail.summary.shipping")}
        </ThemedText>
        <ThemedText className="text-base">
          {t("order_detail.summary.free_shipping")}
        </ThemedText>
      </View>
      <View
        className="flex-row justify-between mt-2.5 pt-2.5"
        style={{
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        }}
      >
        <ThemedText className="text-lg font-bold">
          {t("order_detail.summary.total")}
        </ThemedText>
        <ThemedText className="text-lg font-bold">
          {formatPrice(order.totalAmount, order.currency)}
        </ThemedText>
      </View>
    </BaseCard>
  );
}
