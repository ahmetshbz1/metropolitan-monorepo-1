import api from '@/lib/api';
import type { Order } from '@metropolitan/shared';

interface CreateOrderRequest {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethodId: string;
  notes?: string;
}

interface CreateOrderResponse {
  order: Order & {
    stripeClientSecret?: string;
  };
}

export const ordersApi = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data.orders as Order[]; // Backend returns { orders: [...] }
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data as Order; // Backend returns { order, items, trackingEvents }
  },

  createOrder: async (data: CreateOrderRequest) => {
    const response = await api.post('/orders', data);
    return response.data as CreateOrderResponse;
  },

  cancelOrder: async (id: string) => {
    const response = await api.delete(`/orders/${id}`); // Changed to DELETE
    return response.data.data as Order;
  },

  downloadInvoice: async (orderId: string) => {
    const response = await api.get(`/invoices/${orderId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
