import { apiClient } from "../../api/client";
import type { AdminProductPayload } from "./types";

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
