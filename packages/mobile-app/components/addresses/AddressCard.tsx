//  "AddressCard.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";

import { BaseCard } from "@/components/base/BaseCard";
import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useAddresses } from "@/context/AddressContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export type Address = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  isDeliveryDefault: boolean;
  isBillingDefault: boolean;
  taxId?: string;
};

const AddressInfoLine = ({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View className="flex-row items-center">
      <Ionicons
        name={icon}
        size={16}
        color={colors.textSecondary}
        style={{ marginRight: 8 }}
      />
      <ThemedText className="text-sm flex-1">{text}</ThemedText>
    </View>
  );
};

export const AddressCard = ({ address }: { address: Address }) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const router = useRouter();
  const { deleteAddress, setDefaultAddress } = useAddresses();
  const isDefault = address.isDeliveryDefault || address.isBillingDefault;

  const handleEdit = () => {
    router.push({
      pathname: "/edit-address",
      params: { addressId: address.id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      t("addresses.delete.confirm_title"),
      t("addresses.delete.confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(address.id);
            } catch {
              Alert.alert(
                t("addresses.delete.error_title"),
                t("addresses.delete.error_message")
              );
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = () => {
    const options = [
      t("addresses.set_default_delivery"),
      t("addresses.set_default_billing"),
      t("common.cancel"),
    ];
    const destructiveButtonIndex = -1; // No destructive button
    const cancelButtonIndex = 2;

    const actionHandler = async (type: "delivery" | "billing") => {
      try {
        await setDefaultAddress(address.id, type);
      } catch {
        Alert.alert(t("common.error"), t("addresses.set_default_error"));
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) actionHandler("delivery");
          else if (buttonIndex === 1) actionHandler("billing");
        }
      );
    } else {
      Alert.alert(
        t("addresses.set_default_title"),
        t("addresses.set_default_message"),
        [
          {
            text: t("addresses.set_default_delivery"),
            onPress: () => actionHandler("delivery"),
          },
          {
            text: t("addresses.set_default_billing"),
            onPress: () => actionHandler("billing"),
          },
          { text: t("common.cancel"), style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

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

      {(address.isDeliveryDefault || address.isBillingDefault) && (
        <View
          className="mt-4 pt-3 border-t"
          style={{ borderTopColor: colors.border }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {address.isDeliveryDefault && (
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
            {address.isBillingDefault && (
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
      )}
    </BaseCard>
  );
};
