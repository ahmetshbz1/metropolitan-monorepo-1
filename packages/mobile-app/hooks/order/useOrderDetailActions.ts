//  "useOrderDetailActions.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useOrders } from "@/context/OrderContext";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export function useOrderDetailActions(orderId: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const { cancelOrder, selectedOrder } = useOrders();
  const { dialogState, showDialog, hideDialog, handleConfirm } =
    useConfirmationDialog();
  const { showToast } = useToast();

  const downloadInvoice = () => {
    if (!selectedOrder || !orderId) return;
    router.push(`/invoice-preview?id=${orderId}`);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) {
      return;
    }
    showDialog({
      title: t("order.cancelOrder"),
      message: t("order.cancelOrderConfirmation"),
      icon: "close-circle-outline",
      confirmText: t("order.cancelOrder"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        console.log("[DEBUG] onConfirm başladı");
        try {
          console.log("[DEBUG] cancelOrder çağrılıyor...");
          await cancelOrder(selectedOrder.id);
          console.log("[DEBUG] cancelOrder başarılı");

          console.log("[DEBUG] 100ms sonra router.back() çağrılacak");
          setTimeout(() => {
            console.log("[DEBUG] router.back() çağrılıyor");
            router.back();
            console.log("[DEBUG] router.back() tamamlandı");
          }, 100);
        } catch (error) {
          console.log("[DEBUG] cancelOrder HATA:", error);
          showToast(t("order.cancelOrderError"), "error");
          throw error;
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
