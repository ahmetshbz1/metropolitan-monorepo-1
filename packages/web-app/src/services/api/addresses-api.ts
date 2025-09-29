import { api } from "@/lib/api";

export interface Address {
  id: string;
  title: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  country: string;
  isDefaultDelivery: boolean;
  isDefaultBilling: boolean;
}

export interface CreateAddressRequest {
  title: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  country: string;
  isDefaultDelivery?: boolean;
  isDefaultBilling?: boolean;
}

export const addressesApi = {
  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get("/users/addresses");
    return response.data.data || response.data;
  },

  createAddress: async (data: CreateAddressRequest): Promise<Address> => {
    const response = await api.post("/users/addresses", data);
    return response.data.data || response.data;
  },

  updateAddress: async (id: string, data: Partial<CreateAddressRequest>): Promise<Address> => {
    const response = await api.put(`/users/addresses/${id}`, data);
    return response.data.data || response.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/users/addresses/${id}`);
  },

  setDefaultDelivery: async (id: string): Promise<Address> => {
    const response = await api.patch(`/users/addresses/${id}/default-delivery`);
    return response.data.data || response.data;
  },

  setDefaultBilling: async (id: string): Promise<Address> => {
    const response = await api.patch(`/users/addresses/${id}/default-billing`);
    return response.data.data || response.data;
  },
};