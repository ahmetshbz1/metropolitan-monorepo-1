//  "useOrderDetailActions.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useOrders } from "@/context/OrderContext";

export function useOrderDetailActions(orderId: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const { cancelOrder, selectedOrder } = useOrders();

  const downloadInvoice = () => {
    if (!selectedOrder || !orderId) return;
    router.push(`/invoice-preview?id=${orderId}`);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    Alert.alert(t("order.cancelOrder"), t("order.cancelOrderConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("order.cancelOrder"),
        style: "destructive",
        onPress: async () => {
          try {
            await cancelOrder(selectedOrder.order.id);
            router.back();
          } catch {
            Alert.alert(t("common.error"), t("order.cancelOrderError"));
          }
        },
      },
    ]);
  };

  return {
    downloadInvoice,
    handleCancelOrder,
  };
}
