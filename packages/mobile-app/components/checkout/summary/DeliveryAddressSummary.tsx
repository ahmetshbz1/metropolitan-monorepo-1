//  "DeliveryAddressSummary.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export function DeliveryAddressSummary() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { state } = useCheckout();
  const { deliveryAddress } = state;

  return (
    <BaseCard>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Ionicons
            name="location-outline"
            size={20}
            color={colors.textSecondary}
          />
          <ThemedText className="font-semibold text-base ml-2">
            {t("checkout.delivery_address")}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={() => router.push("/checkout/address")}>
          <ThemedText
            className="text-sm font-medium"
            style={{ color: colors.tint }}
          >
            {t("common.change")}
          </ThemedText>
        </TouchableOpacity>
      </View>
      {deliveryAddress && (
        <View>
          <ThemedText className="font-medium">
            {deliveryAddress.addressTitle}
          </ThemedText>
          <ThemedText className="text-sm opacity-80 mt-1">
            {deliveryAddress.street}, {deliveryAddress.city},{" "}
            {deliveryAddress.postalCode}
          </ThemedText>
        </View>
      )}
    </BaseCard>
  );
}
