//  "OrderContext.tsx"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import React, { useMemo } from "react";
import { OrderStateProvider, useOrderState } from "./order/OrderStateContext";
import { OrderActionsProvider, useOrderActions } from "./order/OrderActionsContext";
import type { Order, OrderDetail, OrderCreationResult } from "@metropolitan/shared";

// =================================================================
// Shared types (imported from @metropolitan/shared)
// =================================================================
export type {
  Address,
  OrderDetail,
  OrderItem,
  PaymentMethodType,
  TrackingEvent,
  User,
  FullOrderPayload,
  Order,
} from "@metropolitan/shared";

interface IOrderContext {
  orders: Order[];
  loading: boolean;
  selectedOrder: OrderDetail | null;
  loadingDetail: boolean;
  error: string | null;
  fetchOrders: (forceRefresh?: boolean) => Promise<void>;
  refreshOrders: () => Promise<void>;
  fetchOrderById: (
    id: string,
    forceRefresh?: boolean
  ) => Promise<OrderDetail | null>;
  createOrder: (data: {
    shippingAddressId: string;
    billingAddressId?: string;
    paymentMethodId: string;
    notes?: string;
  }) => Promise<OrderCreationResult>;
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
