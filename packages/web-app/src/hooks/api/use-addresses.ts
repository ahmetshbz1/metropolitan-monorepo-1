import { addressesApi, Address, CreateAddressRequest } from "@/services/api/addresses-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const addressKeys = {
  all: ["addresses"] as const,
  lists: () => [...addressKeys.all, "list"] as const,
  detail: (id: string) => [...addressKeys.all, "detail", id] as const,
};

export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.lists(),
    queryFn: addressesApi.getAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAddressRequest> }) =>
      addressesApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
  });
}

export function useSetDefaultDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.setDefaultDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
  });
}

export function useSetDefaultBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.setDefaultBilling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
  });
}