import { apiClient } from "./client";

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  namePl: string;
  image: string;
  price: number;
  currency: string;
  size: string;
  brand: string;
  category: string;
  stock: number;
  minQuantity: number;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getProducts = async (params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> => {
  const response = await apiClient.get<ProductsResponse>("/products", {
    params: {
      lang: "tr",
      ...params,
    },
  });
  return response.data;
};
