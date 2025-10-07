import { apiClient } from "../../api/client";
import { ADMIN_TOKEN_STORAGE_KEY, API_BASE_URL } from "../../config/env";
import type { AdminProductPayload, ProductsListResponse } from "./types";

export const uploadProductImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

  const response = await fetch(`${API_BASE_URL}/api/admin/products/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Görsel yüklenemedi");
  }

  const data = await response.json() as { success: boolean; imageUrl: string };
  return data.imageUrl;
};

export const getProducts = async (params?: {
  limit?: number;
  offset?: number;
}): Promise<ProductsListResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.limit !== undefined) {
    searchParams.append("limit", params.limit.toString());
  }
  if (params?.offset !== undefined) {
    searchParams.append("offset", params.offset.toString());
  }

  const query = searchParams.toString();
  const url = `/admin/products${query ? `?${query}` : ""}`;

  const response = await apiClient.get<ProductsListResponse>(url);
  return response.data;
};

export const createProduct = async (payload: AdminProductPayload) => {
  await apiClient.post("/admin/products", payload);
};

export const updateProduct = async (
  productId: string,
  payload: AdminProductPayload
) => {
  await apiClient.put(`/admin/products/${productId}`, payload);
};

export const deleteProduct = async (productId: string) => {
  await apiClient.delete(`/admin/products/${productId}`);
};
