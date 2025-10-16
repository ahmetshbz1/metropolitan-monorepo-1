import { apiClient } from "./client";

export interface AdminCartItem {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string;
  userType: "individual" | "corporate";
  productId: string;
  productName: string | null;
  productCode: string;
  productImage: string | null;
  price: string | null;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  lastActivityDays: number;
}

export interface CartsResponse {
  carts: AdminCartItem[];
  total: number;
}

export interface CartFilters {
  search?: string;
  userType?: string;
  abandonedOnly?: boolean;
  abandonedDays?: number;
  limit?: number;
  offset?: number;
}

export interface UserCartDetails {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string;
  userType: "individual" | "corporate";
  items: Array<{
    id: string;
    productId: string;
    productName: string | null;
    productCode: string;
    productImage: string | null;
    price: string | null;
    quantity: number;
    totalPrice: number;
    createdAt: string;
    updatedAt: string;
  }>;
  summary: {
    totalItems: number;
    totalAmount: number;
    itemCount: number;
  };
}

export const getCarts = async (filters?: CartFilters): Promise<CartsResponse> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.userType) params.append("userType", filters.userType);
  if (filters?.abandonedOnly) params.append("abandonedOnly", "true");
  if (filters?.abandonedDays) params.append("abandonedDays", String(filters.abandonedDays));
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  const response = await apiClient.get<CartsResponse>(`/admin/carts?${params.toString()}`);
  return response.data;
};

export const getUserCart = async (userId: string): Promise<UserCartDetails> => {
  const response = await apiClient.get<UserCartDetails>(`/admin/carts/user/${userId}`);
  return response.data;
};
