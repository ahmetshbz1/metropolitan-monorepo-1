import { apiClient } from "../../api/client";
import { ADMIN_TOKEN_STORAGE_KEY, API_BASE_URL } from "../../config/env";
import type {
  AdminProductPayload,
  ProductsListResponse,
  ProductImportSummary,
  ProductImageInfo,
} from "./types";

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

export const uploadProductImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

  const response = await fetch(`${API_BASE_URL}/api/admin/products/upload-images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Görseller yüklenemedi");
  }

  const data = await response.json() as { success: boolean; imageUrls: string[] };
  return data.imageUrls;
};

export const deleteProductImage = async (imageUrl: string): Promise<void> => {
  await apiClient.delete("/admin/products/delete-image", { data: { imageUrl } });
};

export const deleteProductImages = async (imageUrls: string[]): Promise<void> => {
  await apiClient.delete("/admin/products/delete-images", { data: { imageUrls } });
};

export const getProductImages = async (): Promise<ProductImageInfo[]> => {
  const response = await apiClient.get<{ success: boolean; images: ProductImageInfo[] }>(
    "/admin/products/images"
  );
  return response.data.images;
};

export const getProducts = async (params?: {
  limit?: number;
  offset?: number;
  search?: string;
  categoryId?: string;
}): Promise<ProductsListResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.limit !== undefined) {
    searchParams.append("limit", params.limit.toString());
  }
  if (params?.offset !== undefined) {
    searchParams.append("offset", params.offset.toString());
  }
  if (params?.search) {
    searchParams.append("search", params.search);
  }
  if (params?.categoryId) {
    searchParams.append("categoryId", params.categoryId);
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

export const exportProducts = async (options?: {
  format?: "csv" | "xlsx";
  languageCode?: string;
}): Promise<Blob> => {
  const params = new URLSearchParams();
  if (options?.format) {
    params.append("format", options.format);
  }
  if (options?.languageCode) {
    params.append("languageCode", options.languageCode);
  }

  const query = params.toString();
  const response = await apiClient.get<Blob>(
    `/admin/products/export${query ? `?${query}` : ""}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};

export const importProducts = async (
  file: File
): Promise<ProductImportSummary> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

  const response = await fetch(`${API_BASE_URL}/api/admin/products/import`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message ?? "Toplu yükleme başarısız");
  }

  return (payload as { summary: ProductImportSummary }).summary;
};
