import { apiClient } from "../../api/client";
import type { AdminCategoryPayload, CategoriesListResponse } from "./types";

export const getCategories = async (): Promise<CategoriesListResponse> => {
  const response = await apiClient.get<CategoriesListResponse>("/admin/categories");
  return response.data;
};

export const createCategory = async (payload: AdminCategoryPayload) => {
  await apiClient.post("/admin/categories", payload);
};

export const deleteCategory = async (categoryId: string) => {
  await apiClient.delete(`/admin/categories/${categoryId}`);
};
