//  "OrderStateContext.tsx"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import React, { createContext, useContext, useRef, useState } from "react";
import type { FullOrderPayload, Order } from "@metropolitan/shared/types";

export type {
  Address,
  OrderDetail,
  OrderItem,
  PaymentMethod,
  TrackingEvent,
  User,
} from "@metropolitan/shared/types";

interface IOrderStateContext {
  orders: Order[];
  loading: boolean;
  selectedOrder: FullOrderPayload | null;
  loadingDetail: boolean;
  error: any;
  lastFetchTime: number | null;
  orderDetailCache: Map<string, { data: FullOrderPayload; timestamp: number }>;
  ordersRef: React.MutableRefObject<Order[]>;
  lastFetchTimeRef: React.MutableRefObject<number | null>;
  setOrders: (orders: Order[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedOrder: (order: FullOrderPayload | null) => void;
  setLoadingDetail: (loading: boolean) => void;
  setError: (error: any) => void;
  setLastFetchTime: (time: number) => void;
  setOrderDetailCache: (
    cache: Map<string, { data: FullOrderPayload; timestamp: number }>
  ) => void;
}

const OrderStateContext = createContext<IOrderStateContext | undefined>(
  undefined
);

export const OrderStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<FullOrderPayload | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [orderDetailCache, setOrderDetailCache] = useState<
    Map<string, { data: FullOrderPayload; timestamp: number }>
  >(new Map());

  // Use refs to avoid dependency issues
  const ordersRef = useRef<Order[]>([]);
  const lastFetchTimeRef = useRef<number | null>(null);

  // Keep refs in sync with state
  ordersRef.current = orders;
  lastFetchTimeRef.current = lastFetchTime;

  return (
    <OrderStateContext.Provider
      value={{
        orders,
        loading,
        selectedOrder,
        loadingDetail,
        error,
        lastFetchTime,
        orderDetailCache,
        ordersRef,
        lastFetchTimeRef,
        setOrders,
        setLoading,
        setSelectedOrder,
        setLoadingDetail,
        setError,
        setLastFetchTime,
        setOrderDetailCache,
      }}
    >
      {children}
    </OrderStateContext.Provider>
  );
};

export const useOrderState = () => {
  const context = useContext(OrderStateContext);
  if (context === undefined) {
    throw new Error("useOrderState must be used within an OrderStateProvider");
  }
  return context;
};