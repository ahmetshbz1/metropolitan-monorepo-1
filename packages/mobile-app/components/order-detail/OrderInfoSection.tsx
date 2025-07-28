//  "OrderInfoSection.tsx"
//  metropolitan app
//  Created by Ahmet on 12.07.2025. Düzenlenme tarihi: 21.07.2025.

import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { BaseCard } from "@/components/base/BaseCard";
import { OrderDetail } from "@/context/OrderContext";
import { DateFormats, formatDate } from "@/utils/date.utils";
import { ThemedText } from "../ThemedText";
import Colors, { StatusUtils } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface OrderInfoSectionProps {
  order: OrderDetail;
}

export function OrderInfoSection({ order }: OrderInfoSectionProps) {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const statusColors = StatusUtils.getStatusColor(order.status, colors);

  return (
    <BaseCard>
      <View>
        {/* Status Badge */}
        <View className="mb-4">
          <View
            className="px-3 py-1.5 rounded-2xl self-start"
            style={{
              backgroundColor: statusColors.bg,
            }}
          >
            <ThemedText
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: statusColors.text }}
            >
              {StatusUtils.getStatusText(order.status, t)}
            </ThemedText>
          </View>
        </View>
        
        {/* Order Info */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <ThemedText className="text-sm opacity-70 mb-1">
              {t("order_detail.info.order_no_label")}
            </ThemedText>
            <ThemedText className="text-base font-semibold">
              {order.orderNumber}
            </ThemedText>
          </View>
          <View className="items-end">
            <ThemedText className="text-sm opacity-70 mb-1">
              {t("order_detail.info.order_date_label")}
            </ThemedText>
            <ThemedText className="text-base font-medium">
              {formatDate(order.createdAt, DateFormats.FULL_WITH_TIME, i18n.language)}
            </ThemedText>
          </View>
        </View>
      </View>
    </BaseCard>
  );
}
