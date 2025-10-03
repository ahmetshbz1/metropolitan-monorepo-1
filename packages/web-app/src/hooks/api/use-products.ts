import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api/products-api';
import { useTranslation } from 'react-i18next';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export function useProducts(params?: { category?: string; search?: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'tr';
  
  return useQuery({
    queryKey: productKeys.list({ ...params, lang }),
    queryFn: () => productsApi.getProducts({ ...params, lang }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProductsSuspense(params?: { category?: string; search?: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'tr';
  
  return useSuspenseQuery({
    queryKey: productKeys.list({ ...params, lang }),
    queryFn: () => productsApi.getProducts({ ...params, lang }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'tr';

  return useQuery({
    queryKey: [...productKeys.detail(id), lang],
    queryFn: () => productsApi.getProductById(id, lang),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductSearch(query: string) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'tr';

  return useQuery({
    queryKey: [...productKeys.all, 'search', query, lang],
    queryFn: () => productsApi.searchProducts(query, lang),
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000, // Increased to 5 minutes for better caching
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for search
  });
}
