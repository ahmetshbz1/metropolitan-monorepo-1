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
      paymentTermDays?: number;
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
          ...(data.paymentTermDays !== undefined && { paymentTermDays: data.paymentTermDays }),
        };

        console.log("📤 Sending order payload:", payload);
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
      console.log("[DEBUG] cancelOrder başladı, orderId:", orderId);
      setLoading(true);
      setError(null);
      try {
        console.log("[DEBUG] API DELETE çağrılıyor...");
        await api.delete(`/orders/${orderId}`);
        console.log("[DEBUG] API DELETE başarılı, fetchOrders çağrılıyor...");
        await fetchOrders(); // Refresh the orders list
        console.log("[DEBUG] fetchOrders tamamlandı");
      } catch (err: any) {
        console.log("[DEBUG] cancelOrder HATA:", err);
        setError(err.response?.data || err);
        throw err;
      } finally {
        console.log("[DEBUG] cancelOrder finally, setLoading(false)");
        setLoading(false);
      }
    },
    [fetchOrders, setLoading, setError]
  );

  const rollbackStock = useCallback(
    async (orderId: string) => {
      // Removed console statement

      try {
        const response = await api.post(`/orders/${orderId}/rollback-stock`);
        // Removed console statement
        return response.data;
      } catch (err: any) {
        // Removed console statement
        const errorMessage = err.response?.data?.message || err.message || 'Stok geri alımı başarısız oldu';
        throw new Error(errorMessage);
      }
    },
    []
  );

  return {
    createOrder,
    cancelOrder,
    rollbackStock,
  };
};