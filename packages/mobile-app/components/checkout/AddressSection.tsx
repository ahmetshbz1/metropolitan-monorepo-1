//  "AddressSection.tsx"
//  metropolitan app
//  Created by Ahmet on 25.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BaseButton } from "@/components/base/BaseButton";
import { BaseCard } from "@/components/base/BaseCard";
import Colors, { ColorUtils } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import type { Address } from "@metropolitan/shared";

interface AddressSectionProps {
  title: string;
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress: (address: Address) => void;
  showAddButton?: boolean;
}

export const AddressSection = ({
  title,
  addresses,
  selectedAddressId,
  onSelectAddress,
  showAddButton = true,
}: AddressSectionProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { withHapticFeedback } = useHaptics();

  const renderAddressCard = (address: Address, isSelected: boolean) => (
    <Pressable
      key={address.id}
      onPress={withHapticFeedback(() => onSelectAddress(address))}
      android_ripple={{ color: "transparent" }}
      style={{ marginBottom: 12 }}
    >
      <BaseCard
        style={{
          borderWidth: 2,
          borderColor: isSelected ? colors.tint : colors.border,
          backgroundColor: isSelected
            ? colorScheme === "dark"
              ? ColorUtils.withOpacity(colors.tint, 0.3)
              : colors.tintLight
            : colors.card,
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-2">
            <ThemedText className="font-semibold text-lg mb-1">
              {address.addressTitle}
            </ThemedText>
            <ThemedText className="opacity-70 leading-5">
              {address.street}, {address.city}, {address.postalCode}
            </ThemedText>
          </View>

          <View className="flex-row items-center" style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: "/edit-address",
                  params: { addressId: address.id },
                });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View
              className="w-6 h-6 rounded-full border-2 justify-center items-center"
              style={{
                borderColor: isSelected ? colors.tint : colors.mediumGray,
              }}
            >
              {isSelected && (
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.tint }}
                />
              )}
            </View>
          </View>
        </View>
      </BaseCard>
    </Pressable>
  );

  return (
    <View>
      <ThemedText className="text-lg font-semibold mb-4">{title}</ThemedText>

      {addresses.map((address) =>
        renderAddressCard(address, selectedAddressId === address.id)
      )}

      {showAddButton && (
        <BaseButton
          variant="secondary"
          size="small"
          title={`+ ${t("checkout.add_new_address")}`}
          onPress={() => router.push("/add-address")}
          style={{ marginTop: 8 }}
        />
      )}
    </View>
  );
};