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
    return response.data.data as Order[];
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data as Order;
  },

  createOrder: async (data: CreateOrderRequest) => {
    const response = await api.post('/orders', data);
    return response.data as CreateOrderResponse;
  },

  cancelOrder: async (id: string) => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data.data as Order;
  },
};
