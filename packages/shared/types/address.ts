//  "address.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.

export interface Address {
  id: string;
  userId: string;
  addressTitle: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefaultDelivery: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressData {
  addressTitle: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface UpdateAddressData {
  addressTitle?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface AddressContextType {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  fetchAddresses: () => void;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (
    id: string,
    type: "delivery" | "billing"
  ) => Promise<void>;
}
