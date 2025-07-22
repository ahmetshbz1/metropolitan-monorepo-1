//  "AddressContext.tsx"
//  metropolitan app
//  Created by Ahmet on 02.07.2025.

import { api } from "@/core/api";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

import {
  Address,
  AddressContextType,
  AddressData,
  UpdateAddressData,
} from "../../shared/types/address";

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchAddresses = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get("/users/me/addresses");

      if (data.success) {
        setAddresses(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch addresses");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (addressData: AddressData) => {
    if (!token) {
      throw new Error("Authentication token is not available.");
    }

    try {
      const { data } = await api.post("/users/me/addresses", addressData);

      if (data.success) {
        setAddresses((prevAddresses) => [...prevAddresses, data.data]);
      } else {
        throw new Error(data.message || "Failed to add address.");
      }
    } catch (e) {
      console.error("Failed to add address", e);
      throw e;
    }
  };

  const updateAddress = async (
    addressId: string,
    addressData: UpdateAddressData
  ) => {
    try {
      const { data } = await api.put(
        `/users/me/addresses/${addressId}`,
        addressData
      );
      if (data.success) {
        setAddresses((prevAddresses) =>
          prevAddresses.map((addr) =>
            addr.id === addressId ? data.data : addr
          )
        );
      } else {
        throw new Error(data.message || "Failed to update address.");
      }
    } catch (e) {
      console.error("Failed to update address", e);
      throw e;
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const { data } = await api.delete(`/users/me/addresses/${addressId}`);
      if (data.success) {
        setAddresses((prevAddresses) =>
          prevAddresses.filter((addr) => addr.id !== addressId)
        );
      } else {
        throw new Error(data.message || "Failed to delete address.");
      }
    } catch (e) {
      console.error("Failed to delete address", e);
      throw e;
    }
  };

  const setDefaultAddress = async (
    id: string,
    type: "delivery" | "billing"
  ) => {
    const endpoint = `/users/me/addresses/${id}/set-default`;
    try {
      await api.post(endpoint, { type });

      setAddresses((prevAddresses) =>
        prevAddresses.map((addr) => {
          const key =
            type === "delivery" ? "isDefaultDelivery" : "isDefaultBilling";
          if (addr.id !== id && addr[key]) {
            return { ...addr, [key]: false };
          }
          if (addr.id === id) {
            return { ...addr, [key]: true };
          }
          return addr;
        })
      );
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to set default address");
      throw e;
    }
  };

  useEffect(() => {
    if (token) {
      fetchAddresses();
    } else {
      // Handle case where user is not logged in
      setAddresses([]);
      setLoading(false);
    }
  }, [token]);

  return (
    <AddressContext.Provider
      value={{
        addresses,
        loading,
        error,
        fetchAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error("useAddresses must be used within an AddressProvider");
  }
  return context;
};
