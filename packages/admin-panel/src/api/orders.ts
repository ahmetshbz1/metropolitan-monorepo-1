import { apiClient } from "./client";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethodType: string | null;
  paymentTermDays: number | null;
  totalAmount: string;
  currency: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingCity: string;
  userType: "individual" | "corporate";
  invoicePdfPath: string | null;
  invoiceGeneratedAt: string | null;
  trackingNumber: string | null;
  shippingCompany: string | null;
  estimatedDelivery: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  notes: string | null;
  itemCount: number;
  items: OrderItem[];
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateOrderStatusInput {
  status: string;
  trackingNumber?: string | null;
  shippingCompany?: string | null;
  cancelReason?: string | null;
  estimatedDelivery?: string | null;
  notes?: string | null;
}

export interface UpdateOrderPaymentStatusInput {
  paymentStatus: string;
}

export const getOrders = async (filters?: OrderFilters): Promise<OrdersResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  const response = await apiClient.get<OrdersResponse>(`/admin/orders?${params.toString()}`);
  return response.data;
};

export const updateOrderStatus = async (
  orderId: string,
  input: UpdateOrderStatusInput
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.patch(`/admin/orders/${orderId}/status`, input);
  return response.data;
};

export const updateOrderPaymentStatus = async (
  orderId: string,
  input: UpdateOrderPaymentStatusInput
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.patch(`/admin/orders/${orderId}/payment-status`, input);
  return response.data;
};

export const downloadOrderInvoice = async (orderId: string): Promise<Blob> => {
  const response = await apiClient.get<Blob>(`/admin/orders/${orderId}/invoice`, {
    responseType: "blob",
  });

  return response.data;
};

export const exportOrders = async (options?: {
  format?: "csv" | "xlsx";
  status?: string;
  paymentStatus?: string;
}): Promise<Blob> => {
  const params = new URLSearchParams();
  if (options?.format) {
    params.append("format", options.format);
  }
  if (options?.status) {
    params.append("status", options.status);
  }
  if (options?.paymentStatus) {
    params.append("paymentStatus", options.paymentStatus);
  }

  const query = params.toString();
  const response = await apiClient.get<Blob>(
    `/admin/orders/export${query ? `?${query}` : ""}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};

export const deleteOrder = async (orderId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/admin/orders/${orderId}`);
  return response.data;
};
