//  "[id].tsx"
//  metropolitan app
//  Created by Ahmet on 20.06.2025. Edited on 21.07.2025.

import React from "react";
import { useLocalSearchParams } from "expo-router";

import { OrderDetailContainer } from "@/components/order-detail/OrderDetailContainer";
import { useOrderDetailHeader } from "@/hooks/order/useOrderDetailHeader";
import { useOrderDetailActions } from "@/hooks/order/useOrderDetailActions";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  useOrderDetailHeader();
  const { downloadInvoice, handleCancelOrder } = useOrderDetailActions(id || "");

  if (!id) {
    return null;
  }

  return (
    <OrderDetailContainer
      orderId={id}
      onDownloadInvoice={downloadInvoice}
      onCancelOrder={handleCancelOrder}
    />
  );
}
