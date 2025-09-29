import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api/products-api';
import { useTranslation } from 'react-i18next';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...categoryKeys.lists(), params] as const,
};

export function useCategories() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'tr';
  
  return useQuery({
    queryKey: categoryKeys.list({ lang }),
    queryFn: () => productsApi.getCategories({ lang }),
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change rarely)
  });
}

export function useCategoriesSuspense() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'tr';
  
  return useSuspenseQuery({
    queryKey: categoryKeys.list({ lang }),
    queryFn: () => productsApi.getCategories({ lang }),
    staleTime: 10 * 60 * 1000,
  });
}
