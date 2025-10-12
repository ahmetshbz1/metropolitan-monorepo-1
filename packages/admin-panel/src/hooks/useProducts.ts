// React Query hooks for product management
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, fetchProduct, updateProduct, createProduct, deleteProduct } from "../api/products";
import type { AdminProduct, AdminProductPayload } from "../api/products";

// Query keys
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Fetch all products
export function useProducts(page: number = 1, limit: number = 50, search?: string) {
  return useQuery({
    queryKey: productKeys.list(`page=${page}&limit=${limit}&search=${search || ""}`),
    queryFn: () => fetchProducts(page, limit, search),
  });
}

// Fetch single product
export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(productId || ""),
    queryFn: () => {
      if (!productId) throw new Error("Product ID required");
      return fetchProduct(productId);
    },
    enabled: !!productId,
  });
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: AdminProductPayload }) =>
      updateProduct(productId, payload),
    onSuccess: (_, variables) => {
      // Invalidate ve refetch
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminProductPayload) => createProduct(payload),
    onSuccess: () => {
      // Tüm product listelerini invalidate et
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
