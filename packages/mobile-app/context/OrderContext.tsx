//  "OrderContext.tsx"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import React, { useMemo } from "react";
import { OrderStateProvider, useOrderState } from "./order/OrderStateContext";
import { OrderActionsProvider, useOrderActions } from "./order/OrderActionsContext";

// =================================================================
// Shared types (imported from @metropolitan/shared)
// =================================================================
export type {
  Address,
  OrderDetail,
  OrderItem,
  PaymentMethod,
  TrackingEvent,
  User,
  FullOrderPayload,
  Order,
} from "@metropolitan/shared/types";

interface IOrderContext {
  orders: any[];
  loading: boolean;
  selectedOrder: any | null;
  loadingDetail: boolean;
  error: any;
  fetchOrders: (forceRefresh?: boolean) => Promise<void>;
  refreshOrders: () => Promise<void>;
  fetchOrderById: (
    id: string,
    forceRefresh?: boolean
  ) => Promise<any>;
  createOrder: (data: {
    shippingAddressId: string;
    billingAddressId?: string;
    paymentMethodId: string;
    notes?: string;
  }) => Promise<any>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const OrderProviderInternal = ({ children }: { children: React.ReactNode }) => {
  return (
    <OrderStateProvider>
      <OrderActionsProvider>{children}</OrderActionsProvider>
    </OrderStateProvider>
  );
};

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  return <OrderProviderInternal>{children}</OrderProviderInternal>;
};

export const useOrders = (): IOrderContext => {
  const state = useOrderState();
  const actions = useOrderActions();

  return useMemo(
    () => ({
      orders: state.orders,
      loading: state.loading,
      selectedOrder: state.selectedOrder,
      loadingDetail: state.loadingDetail,
      error: state.error,
      fetchOrders: actions.fetchOrders,
      refreshOrders: actions.refreshOrders,
      fetchOrderById: actions.fetchOrderById,
      createOrder: actions.createOrder,
      cancelOrder: actions.cancelOrder,
    }),
    [state, actions]
  );
};
