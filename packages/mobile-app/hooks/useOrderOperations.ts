//  "useOrderOperations.ts"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import { api } from "@/core/api";
import { useCallback } from "react";

interface UseOrderOperationsProps {
  setLoading: (loading: boolean) => void;
  setError: (error: any) => void;
  fetchOrders: () => Promise<void>;
}

export const useOrderOperations = ({
  setLoading,
  setError,
  fetchOrders,
}: UseOrderOperationsProps) => {
  const createOrder = useCallback(
    async (data: {
      shippingAddressId: string;
      billingAddressId?: string;
      paymentMethodId: string;
      notes?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        // Prepare API payload
        const payload = {
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId || data.shippingAddressId,
          paymentMethodId: data.paymentMethodId,
          ...(data.notes && { notes: data.notes }),
        };

        const response = await api.post("/orders", payload);
        await fetchOrders(); // Re-fetch orders list
        return response.data;
      } catch (err: any) {
        setError(err.response?.data || err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders, setLoading, setError]
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
    [fetchOrders, setLoading, setError]
  );

  return {
    createOrder,
    cancelOrder,
  };
};