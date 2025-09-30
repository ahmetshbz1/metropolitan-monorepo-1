import { api } from "@/lib/api";
import type { Address } from "@metropolitan/shared";

export interface CreateAddressRequest {
  addressTitle: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefaultDelivery?: boolean;
  isDefaultBilling?: boolean;
}

export type { Address };

export const addressesApi = {
  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get("/users/me/addresses");
    return response.data.data || response.data;
  },

  createAddress: async (data: CreateAddressRequest): Promise<Address> => {
    const response = await api.post("/users/me/addresses", data);
    return response.data.data || response.data;
  },

  updateAddress: async (id: string, data: Partial<CreateAddressRequest>): Promise<Address> => {
    const response = await api.put(`/users/me/addresses/${id}`, data);
    return response.data.data || response.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/users/me/addresses/${id}`);
  },

  setDefaultDelivery: async (id: string): Promise<Address> => {
    const response = await api.patch(`/users/me/addresses/${id}/default-delivery`);
    return response.data.data || response.data;
  },

  setDefaultBilling: async (id: string): Promise<Address> => {
    const response = await api.patch(`/users/me/addresses/${id}/default-billing`);
    return response.data.data || response.data;
  },
};