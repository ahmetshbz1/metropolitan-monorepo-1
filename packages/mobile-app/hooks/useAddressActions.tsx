//  "useAddressActions.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  Alert,
  Platform,
} from "react-native";

import { useAddresses } from "@/context/AddressContext";

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

export const useAddressActions = (address: Address) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { deleteAddress, setDefaultAddress } = useAddresses();

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

  return {
    handleEdit,
    handleDelete,
    handleSetDefault,
  };
};