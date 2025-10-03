import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api/orders-api';
import { useTranslation } from 'react-i18next';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export function useOrders(enabled: boolean = true) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'tr';

  return useQuery({
    queryKey: [...orderKeys.lists(), lang],
    queryFn: ordersApi.getOrders,
    enabled: enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useOrder(id: string) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'tr';

  return useQuery({
    queryKey: [...orderKeys.detail(id), lang],
    queryFn: () => ordersApi.getOrderById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds (orders update frequently)
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ordersApi.cancelOrder,
    onSuccess: (data) => {
      queryClient.setQueryData(orderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
