//  "useAddressActions.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  Platform,
} from "react-native";

import { useAddresses } from "@/context/AddressContext";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useToast } from "@/hooks/useToast";
import type { Address } from "@metropolitan/shared";

export const useAddressActions = (address: Address) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { deleteAddress, setDefaultAddress } = useAddresses();
  const { dialogState, showDialog, hideDialog, handleConfirm } = useConfirmationDialog();
  const { showToast } = useToast();

  const handleEdit = () => {
    router.push({
      pathname: "/edit-address",
      params: { addressId: address.id },
    });
  };

  const handleDelete = () => {
    showDialog({
      title: t("addresses.delete.confirm_title"),
      message: t("addresses.delete.confirm_message"),
      icon: "trash-outline",
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteAddress(address.id);
        } catch {
          showToast(t("addresses.delete.error_message"), "error");
        }
      },
    });
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
        showToast(t("addresses.set_default_error"), "error");
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
    dialogState,
    hideDialog,
    handleConfirm,
  };
};