//  "OrderActionsContext.tsx"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import React, { createContext, useContext } from "react";
import type { FullOrderPayload } from "@metropolitan/shared";
import { useOrderState } from "./OrderStateContext";
import { useOrderFetch } from "@/hooks/useOrderFetch";
import { useOrderOperations } from "@/hooks/useOrderOperations";

interface IOrderActionsContext {
  fetchOrders: (forceRefresh?: boolean) => Promise<void>;
  refreshOrders: () => Promise<void>;
  fetchOrderById: (
    id: string,
    forceRefresh?: boolean
  ) => Promise<FullOrderPayload>;
  createOrder: (data: {
    shippingAddressId: string;
    billingAddressId?: string;
    paymentMethodId: string;
    notes?: string;
  }) => Promise<any>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const OrderActionsContext = createContext<IOrderActionsContext | undefined>(
  undefined
);

export const OrderActionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const state = useOrderState();

  const { fetchOrders, refreshOrders, fetchOrderById } = useOrderFetch({
    setOrders: state.setOrders,
    setLoading: state.setLoading,
    setSelectedOrder: state.setSelectedOrder,
    setLoadingDetail: state.setLoadingDetail,
    setError: state.setError,
    setLastFetchTime: state.setLastFetchTime,
    setOrderDetailCache: state.setOrderDetailCache,
    ordersRef: state.ordersRef,
    lastFetchTimeRef: state.lastFetchTimeRef,
    orderDetailCache: state.orderDetailCache,
  });

  const { createOrder, cancelOrder } = useOrderOperations({
    setLoading: state.setLoading,
    setError: state.setError,
    fetchOrders,
  });

  return (
    <OrderActionsContext.Provider
      value={{
        fetchOrders,
        refreshOrders,
        fetchOrderById,
        createOrder,
        cancelOrder,
      }}
    >
      {children}
    </OrderActionsContext.Provider>
  );
};

export const useOrderActions = () => {
  const context = useContext(OrderActionsContext);
  if (context === undefined) {
    throw new Error("useOrderActions must be used within an OrderActionsProvider");
  }
  return context;
};