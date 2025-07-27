//  "AddressDefaultBadges.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface AddressDefaultBadgesProps {
  isDeliveryDefault: boolean;
  isBillingDefault: boolean;
}

export const AddressDefaultBadges = ({
  isDeliveryDefault,
  isBillingDefault,
}: AddressDefaultBadgesProps) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  if (!isDeliveryDefault && !isBillingDefault) {
    return null;
  }

  return (
    <View
      className="mt-4 pt-3 border-t"
      style={{ borderTopColor: colors.border }}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {isDeliveryDefault && (
          <View
            className="flex-row items-center gap-2 px-2 py-1 rounded"
            style={{ backgroundColor: colors.tint + "20" }}
          >
            <Ionicons
              name="car-sport-outline"
              size={14}
              color={colors.tint}
            />
            <ThemedText
              className="text-xs font-medium"
              style={{ color: colors.tint }}
            >
              {t("addresses.default_delivery")}
            </ThemedText>
          </View>
        )}
        {isBillingDefault && (
          <View
            className="flex-row items-center gap-2 px-2 py-1 rounded"
            style={{ backgroundColor: colors.tint + "20" }}
          >
            <Ionicons
              name="document-text-outline"
              size={14}
              color={colors.tint}
            />
            <ThemedText
              className="text-xs font-medium"
              style={{ color: colors.tint }}
            >
              {t("addresses.default_billing")}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
};