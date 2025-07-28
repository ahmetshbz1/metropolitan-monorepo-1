//  "orderSlice.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { StateCreator } from 'zustand';
import { EcommerceStore, OrderSlice } from '../types';
import { handleApiError } from '../utils';
import api from '@/core/api';
import { Order, OrderDetail } from '@metropolitan/shared';

export const createOrderSlice: StateCreator<
  EcommerceStore,
  [],
  [],
  OrderSlice & {
    fetchOrders: (page?: number) => Promise<void>;
    fetchOrderDetail: (orderId: string) => Promise<void>;
    reorderItems: (orderId: string) => Promise<void>;
  }
> = (set, get) => ({
  // Order state
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  hasMore: true,
  page: 1,

  // Fetch orders with pagination
  fetchOrders: async (page: number = 1) => {
    const { isAuthenticated, token } = get();
    
    if (!isAuthenticated || !token) {
      set({ error: 'Giriş yapmanız gerekiyor.' });
      return;
    }

    // Don't show loading for pagination
    if (page === 1) {
      set({ loading: true, error: null });
    }

    try {
      const response = await api.get('/orders', {
        params: { page, limit: 20 },
        headers: { Authorization: `Bearer ${token}` },
      });

      const { orders, hasMore, currentPage } = response.data;

      set((state) => ({
        orders: page === 1 ? orders : [...state.orders, ...orders],
        hasMore,
        page: currentPage,
        loading: false,
        error: null,
      }));

    } catch (error) {
      set({
        loading: false,
        error: handleApiError(error),
      });
    }
  },

  // Fetch detailed order information
  fetchOrderDetail: async (orderId: string) => {
    const { isAuthenticated, token } = get();
    
    if (!isAuthenticated || !token) {
      set({ error: 'Giriş yapmanız gerekiyor.' });
      return;
    }

    set({ loading: true, error: null, selectedOrder: null });

    try {
      const response = await api.get(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orderDetail = response.data;

      set({
        selectedOrder: orderDetail,
        loading: false,
        error: null,
      });

    } catch (error) {
      set({
        loading: false,
        error: handleApiError(error),
        selectedOrder: null,
      });
    }
  },

  // Reorder items from previous order
  reorderItems: async (orderId: string) => {
    const { isAuthenticated, token } = get();
    
    if (!isAuthenticated || !token) {
      set({ error: 'Giriş yapmanız gerekiyor.' });
      return;
    }

    set({ loading: true, error: null });

    try {
      // First, get the order details to extract items
      const orderResponse = await api.get(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const order = orderResponse.data;
      const items = order.items || [];

      // Add each item to cart
      const cartPromises = items.map((item: any) => 
        get().addToCart(item.productId, item.quantity)
      );

      await Promise.all(cartPromises);

      // Refresh cart to get updated summary
      await get().refreshCart();

      set({
        loading: false,
        error: null,
      });

    } catch (error) {
      set({
        loading: false,
        error: handleApiError(error),
      });
    }
  },
});