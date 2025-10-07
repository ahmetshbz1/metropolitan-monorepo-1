import { apiClient } from "../../api/client";
import type { AdminProductPayload, ProductsListResponse } from "./types";

export const uploadProductImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post<{ success: boolean; imageUrl: string }>(
    "/admin/products/upload-image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.imageUrl;
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
