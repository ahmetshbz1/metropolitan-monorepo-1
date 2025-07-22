//  "OrderContext.tsx"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import { api } from "@/core/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// =================================================================
// Shared types (imported from @metropolitan/shared)
// =================================================================
import type { FullOrderPayload, Order } from "@metropolitan/shared/types";
export type {
  Address,
  OrderDetail,
  OrderItem,
  PaymentMethod,
  TrackingEvent,
  User,
} from "@metropolitan/shared/types";

interface IOrderContext {
  orders: Order[];
  loading: boolean;
  selectedOrder: FullOrderPayload | null;
  loadingDetail: boolean;
  error: any;
  fetchOrders: (forceRefresh?: boolean) => Promise<void>;
  refreshOrders: () => Promise<void>;
  fetchOrderById: (
    id: string,
    forceRefresh?: boolean
  ) => Promise<FullOrderPayload>;
  createOrder: (data: {
    shippingAddressId: string;
    billingAddressId?: string; // Optional, fallback to shippingAddressId
    paymentMethodId: string;
    notes?: string;
  }) => Promise<any>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<IOrderContext | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
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

  // Cache timeout: 5 minutes
  const CACHE_TIMEOUT = 5 * 60 * 1000;
  // Minimum loading time: 500ms (to prevent flash)
  const MIN_LOADING_TIME = 500;

  const fetchOrders = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Check if we have cached data that's still fresh
    if (
      !forceRefresh &&
      lastFetchTimeRef.current &&
      ordersRef.current.length > 0 &&
      now - lastFetchTimeRef.current < CACHE_TIMEOUT
    ) {
      return; // Use cached data
    }

    // Only show loading if we don't have any data or it's a forced refresh
    if (ordersRef.current.length === 0 || forceRefresh) {
      setLoading(true);
    }

    setError(null);
    try {
      const { data } = await api.get<{ orders: Order[] }>("/orders");
      setOrders(data.orders);
      setLastFetchTime(now);
    } catch (err: any) {
      setError(err);
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(() => {
    return fetchOrders(true); // Force refresh
  }, [fetchOrders]);

  const fetchOrderById = useCallback(
    async (id: string, forceRefresh?: boolean) => {
      const now = Date.now();

      // Get current cache value
      const cached = orderDetailCache.get(id);

      // Check if we have fresh cached data (skip if forceRefresh is true)
      if (!forceRefresh && cached && now - cached.timestamp < CACHE_TIMEOUT) {
        setSelectedOrder(cached.data);
        return cached.data;
      }

      // Only show loading if we don't have cached data or force refresh
      const shouldShowLoading = !cached || forceRefresh;
      if (shouldShowLoading) {
        setLoadingDetail(true);
      }

      setError(null);
      const startTime = Date.now();

      try {
        const { data } = await api.get<FullOrderPayload>(`/orders/${id}`);

        // Update cache
        setOrderDetailCache(
          (prev) => new Map(prev.set(id, { data, timestamp: now }))
        );
        setSelectedOrder(data);

        // Ensure minimum loading time if we showed loading
        if (shouldShowLoading) {
          const elapsed = Date.now() - startTime;
          if (elapsed < MIN_LOADING_TIME) {
            await new Promise((resolve) =>
              setTimeout(resolve, MIN_LOADING_TIME - elapsed)
            );
          }
        }

        return data;
      } catch (err: any) {
        setError(err);
        console.error(`Failed to fetch order ${id}:`, err);
        console.error("Error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
        });
        throw err;
      } finally {
        if (shouldShowLoading) {
          setLoadingDetail(false);
        }
      }
    },
    []
  ); // Empty dependency array to prevent infinite loops

  const createOrder = useCallback(
    async (data: {
      shippingAddressId: string;
      billingAddressId?: string; // Optional, fallback to shippingAddressId
      paymentMethodId: string;
      notes?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        // Prepare API payload
        const payload = {
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId || data.shippingAddressId, // Fallback to shipping
          paymentMethodId: data.paymentMethodId,
          ...(data.notes && { notes: data.notes }),
        };

        const response = await api.post("/orders", payload);
        await fetchOrders(); // Re-fetch orders list
        return response.data;
      } catch (err: any) {
        setError(err.response?.data || err);
        throw err; // Re-throw the error to be caught in the component
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`/orders/${orderId}`);
        await fetchOrders(); // Refresh the orders list
      } catch (err: any) {
        setError(err.response?.data || err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders]
  );

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        selectedOrder,
        loadingDetail,
        error,
        fetchOrders,
        refreshOrders,
        fetchOrderById,
        createOrder,
        cancelOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};
