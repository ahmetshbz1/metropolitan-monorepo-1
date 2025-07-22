//  "OrderCard.tsx"
//  metropolitan app
//  Created by Ahmet on 22.06.2025. Düzenlenme tarihi: 21.07.2025.

import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { BaseCard } from "@/components/base/BaseCard";
import { ThemedText } from "@/components/ThemedText";
import Colors, { StatusUtils } from "@/constants/Colors";
import { Order } from "@/context/OrderContext";
import { formatPrice } from "@/core/utils";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DateFormats, formatDate } from "@/utils/date.utils";

interface OrderCardProps {
  order: Order;
}

// Sub-components
function OrderHeader({ order }: { order: Order }) {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const statusColors = StatusUtils.getStatusColor(order.status, colors);

  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText className="text-base font-semibold">
          {t("orders.order_no", { id: order.orderNumber })}
        </ThemedText>
        <ThemedText className="text-sm mt-1" style={{ color: "#9E9E9E" }}>
          {formatDate(order.createdAt, DateFormats.FULL_DATE, i18n.language)}
        </ThemedText>
      </View>
      <View
        className="px-3 py-1.5 rounded-2xl"
        style={{ backgroundColor: statusColors.bg }}
      >
        <ThemedText
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: statusColors.text }}
        >
          {StatusUtils.getStatusText(order.status, t)}
        </ThemedText>
      </View>
    </View>
  );
}

function OrderFooter({ order, colors }: { order: Order; colors: any }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row justify-between items-center mt-0.5">
      <ThemedText className="text-base font-medium opacity-80">
        {t("orders.total")}
      </ThemedText>
      <View className="flex-row items-center">
        <ThemedText
          className="text-lg font-bold mr-2.5"
          style={{ color: colors.tint }}
        >
          {formatPrice(order.totalAmount, order.currency)}
        </ThemedText>
      </View>
    </View>
  );
}

// Main Component
export function OrderCard({ order }: OrderCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Link href={`/order/${order.id}`} asChild>
      <TouchableOpacity activeOpacity={0.8}>
        <BaseCard style={{ marginBottom: 16 }}>
          <OrderHeader order={order} />
          <View
            className="h-px my-3.5 opacity-70"
            style={{
              backgroundColor:
                colorScheme === "dark"
                  ? colors.borderColor
                  : colors.mediumGray + "30",
            }}
          />
          <OrderFooter order={order} colors={colors} />
        </BaseCard>
      </TouchableOpacity>
    </Link>
  );
}
