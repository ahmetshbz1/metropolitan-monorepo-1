//  "useOrderFetch.ts"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import { api } from "@/core/api";
import { useCallback } from "react";
import type { FullOrderPayload } from "@metropolitan/shared/types";

interface UseOrderFetchProps {
  setOrders: (orders: any[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedOrder: (order: FullOrderPayload | null) => void;
  setLoadingDetail: (loading: boolean) => void;
  setError: (error: any) => void;
  setLastFetchTime: (time: number) => void;
  setOrderDetailCache: (
    cache: Map<string, { data: FullOrderPayload; timestamp: number }>
  ) => void;
  ordersRef: React.MutableRefObject<any[]>;
  lastFetchTimeRef: React.MutableRefObject<number | null>;
  orderDetailCache: Map<string, { data: FullOrderPayload; timestamp: number }>;
}

export const useOrderFetch = ({
  setOrders,
  setLoading,
  setSelectedOrder,
  setLoadingDetail,
  setError,
  setLastFetchTime,
  setOrderDetailCache,
  ordersRef,
  lastFetchTimeRef,
  orderDetailCache,
}: UseOrderFetchProps) => {
  // Cache timeout: 5 minutes
  const CACHE_TIMEOUT = 5 * 60 * 1000;
  // Minimum loading time: 500ms (to prevent flash)
  const MIN_LOADING_TIME = 500;

  const fetchOrders = useCallback(
    async (forceRefresh = false) => {
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
        const { data } = await api.get<{ orders: any[] }>("/orders");
        setOrders(data.orders);
        setLastFetchTime(now);
      } catch (err: any) {
        setError(err);
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    },
    [
      setOrders,
      setLoading,
      setError,
      setLastFetchTime,
      ordersRef,
      lastFetchTimeRef,
    ]
  );

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
[setSelectedOrder, setLoadingDetail, setError, setOrderDetailCache]
  );

  return {
    fetchOrders,
    refreshOrders,
    fetchOrderById,
  };
};