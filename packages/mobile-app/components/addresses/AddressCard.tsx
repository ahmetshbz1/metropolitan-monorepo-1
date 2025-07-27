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
import { useAddressActions, Address } from "@/hooks/useAddressActions";

interface AddressCardProps {
  address: Address;
}

export const AddressCard = ({ address }: AddressCardProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { handleEdit, handleDelete, handleSetDefault } = useAddressActions(address);
  const isDefault = address.isDeliveryDefault || address.isBillingDefault;

  return (
    <BaseCard
      style={{
        marginBottom: 16,
        ...(isDefault && { borderColor: colors.tint, borderWidth: 1.5 }),
      }}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 mr-4">
          <ThemedText className="text-lg font-bold">{address.name}</ThemedText>
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
        <AddressInfoLine icon="location-outline" text={address.address} />
        <AddressInfoLine
          icon="map-outline"
          text={`${address.postalCode}, ${address.city}`}
        />
        {address.taxId && (
          <AddressInfoLine
            icon="document-text-outline"
            text={t("addresses.tax_id", { taxId: address.taxId })}
          />
        )}
      </View>

      <AddressDefaultBadges
        isDeliveryDefault={address.isDeliveryDefault}
        isBillingDefault={address.isBillingDefault}
      />
    </BaseCard>
  );
};

// Re-export the Address type for backward compatibility
export type { Address } from "@/hooks/useAddressActions";
