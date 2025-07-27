//  "useTrackingData.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useState, useEffect } from "react";
import { useOrders } from "@/context/OrderContext";

export const useTrackingData = (orderId: string | undefined) => {
  const { selectedOrder, fetchOrderById } = useOrders();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (orderId) {
      // Tracking sayfasında her zaman fresh data iste
      fetchOrderById(orderId, true);
    }
  }, [orderId, fetchOrderById]);

  const handleRefresh = async () => {
    if (!orderId) return;

    setRefreshing(true);
    try {
      await fetchOrderById(orderId, true);
    } catch (error) {
      console.error("Error refreshing tracking:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return {
    selectedOrder,
    refreshing,
    handleRefresh,
  };
};