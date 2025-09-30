//  "useAddressActions.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAddresses } from "@/context/AddressContext";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useToast } from "@/hooks/useToast";
import type { Address } from "@metropolitan/shared";

export const useAddressActions = (address: Address) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { deleteAddress } = useAddresses();
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


  return {
    handleEdit,
    handleDelete,
    dialogState,
    hideDialog,
    handleConfirm,
  };
};