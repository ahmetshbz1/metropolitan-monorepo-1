"use client";

import { ordersApi } from "@/services/api/orders-api";
import { useCallback, useState } from "react";

interface CreateOrderData {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethodId: string;
  notes?: string;
}

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (data: CreateOrderData) => {
    setLoading(true);
    setError(null);
    try {
      // Prepare API payload (mobile-app ile aynı)
      const payload = {
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId || data.shippingAddressId,
        paymentMethodId: data.paymentMethodId,
        ...(data.notes && { notes: data.notes }),
      };

      console.log("📦 Creating order with payload:", payload);

      const response = await ordersApi.createOrder(payload);

      console.log("✅ Order created successfully:", response);

      return response;
    } catch (err: any) {
      console.error("❌ Order creation failed:", err);
      const errorMessage = err.response?.data?.message || err.message || "Order creation failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createOrder,
    loading,
    error,
  };
};