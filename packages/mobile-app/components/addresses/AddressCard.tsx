//  "AddressCard.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { BaseCard } from "@/components/base/BaseCard";
import { ThemedText } from "@/components/ThemedText";
import { AddressInfoLine } from "./AddressInfoLine";
import { AddressDefaultBadges } from "./AddressDefaultBadges";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAddressActions } from "@/hooks/useAddressActions";
import type { Address } from "@metropolitan/shared";

interface AddressCardProps {
  address: Address;
}

export const AddressCard = ({ address }: AddressCardProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { handleEdit, handleDelete, handleSetDefault } = useAddressActions(address);
  const isDefault = address.isDefaultDelivery || address.isDefaultBilling;

  return (
    <BaseCard
      style={{
        marginBottom: 16,
        ...(isDefault && { borderColor: colors.tint, borderWidth: 1.5 }),
      }}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 mr-4">
          <ThemedText className="text-lg font-bold">{address.addressTitle}</ThemedText>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={handleSetDefault} hitSlop={10}>
            <Ionicons
              name={isDefault ? "star" : "star-outline"}
              size={24}
              color={isDefault ? colors.tint : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} hitSlop={10}>
            <Ionicons
              name="create-outline"
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="gap-3">
        <AddressInfoLine icon="location-outline" text={address.street} />
        <AddressInfoLine
          icon="map-outline"
          text={`${address.postalCode}, ${address.city}`}
        />
      </View>

      <AddressDefaultBadges
        isDeliveryDefault={address.isDefaultDelivery}
        isBillingDefault={address.isDefaultBilling}
      />
    </BaseCard>
  );
};

