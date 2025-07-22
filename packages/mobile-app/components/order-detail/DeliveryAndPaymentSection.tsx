//  "DeliveryAndPaymentSection.tsx"
//  metropolitan app
//  Created by Ahmet on 08.06.2025.

import { ThemedText } from "@/components/ThemedText";
import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { OrderDetail } from "@/context/OrderContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDeliveryAndPayment } from "@/hooks/useDeliveryAndPayment";
import React from "react";
import { View } from "react-native";
import { Divider } from "./Divider";
import { InfoRow } from "./InfoRow";

interface DeliveryAndPaymentSectionProps {
  order: OrderDetail;
}

export function DeliveryAndPaymentSection({
  order,
}: DeliveryAndPaymentSectionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const {
    isExpanded,
    toggleExpand,
    shippingAddress,
    billingAddress,
    paymentMethodName,
    paymentMethodValue,
    paymentExpandable,
    cardholderName,
    t,
  } = useDeliveryAndPayment(order);

  return (
    <BaseCard style={{ marginBottom: 16 }}>
      <ThemedText className="text-lg font-semibold mb-4">
        {t("order_detail.delivery_payment.title")}
      </ThemedText>

      <InfoRow
        icon="card-outline"
        label={t("order_detail.delivery_payment.payment_method")}
        value={paymentMethodName}
        colors={colors}
        isExpandable={paymentExpandable}
        isExpanded={isExpanded}
        onPress={toggleExpand}
      />

      {isExpanded && paymentExpandable && (
        <View className="mt-2.5 pl-10">
          <InfoRow
            icon="person-outline"
            label={t("order_detail.delivery_payment.card_holder")}
            value={cardholderName}
            colors={colors}
          />
          <InfoRow
            icon="card"
            label={t("order_detail.delivery_payment.card_number")}
            value={paymentMethodValue}
            colors={colors}
          />
        </View>
      )}

      <Divider colors={colors} />

      <InfoRow
        icon="location-outline"
        label={t("order_detail.delivery_payment.delivery_address")}
        value={shippingAddress}
        colors={colors}
      />

      <Divider colors={colors} />

      <InfoRow
        icon="document-text-outline"
        label={t("order_detail.delivery_payment.billing_address")}
        value={billingAddress}
        colors={colors}
      />
    </BaseCard>
  );
}
