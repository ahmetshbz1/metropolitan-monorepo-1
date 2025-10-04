//  "OrderContext.tsx"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import type {
  Order,
  OrderCreationResult,
  OrderDetail,
} from "@metropolitan/shared";
import React, { useMemo } from "react";
import {
  OrderActionsProvider,
  useOrderActions,
} from "./order/OrderActionsContext";
import { OrderStateProvider, useOrderState } from "./order/OrderStateContext";

// =================================================================
// Shared types (imported from @metropolitan/shared)
// =================================================================
export type {
  Address,
  FullOrderPayload,
  Order,
  OrderDetail,
  OrderItem,
  PaymentMethodType,
  TrackingEvent,
  User,
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
    paymentTermDays?: number;
    platform?: "web" | "mobile";
  }) => Promise<OrderCreationResult>;
  cancelOrder: (orderId: string) => Promise<void>;
  rollbackStock: (orderId: string) => Promise<any>;
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
      rollbackStock: actions.rollbackStock,
    }),
    [state, actions]
  );
};
