//  "useOrderDetailActions.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useOrders } from "@/context/OrderContext";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useToast } from "@/hooks/useToast";

export function useOrderDetailActions(orderId: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const { cancelOrder, selectedOrder } = useOrders();
  const { dialogState, showDialog, hideDialog, handleConfirm } = useConfirmationDialog();
  const { showToast } = useToast();

  const downloadInvoice = () => {
    if (!selectedOrder || !orderId) return;
    router.push(`/invoice-preview?id=${orderId}`);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    showDialog({
      title: t("order.cancelOrder"),
      message: t("order.cancelOrderConfirmation"),
      icon: "close-circle-outline",
      confirmText: t("order.cancelOrder"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        try {
          await cancelOrder(selectedOrder.order.id);
          router.back();
        } catch {
          showToast(t("order.cancelOrderError"), "error");
        }
      },
    });
  };

  return {
    downloadInvoice,
    handleCancelOrder,
    dialogState,
    hideDialog,
    handleConfirm,
  };
}
