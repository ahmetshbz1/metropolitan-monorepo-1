//  "addressFormatters.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { OrderDetail } from "@/context/OrderContext";

export const formatAddress = (address: {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}) => {
  return `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;
};

export const formatOrderAddresses = (order: OrderDetail) => {
  const shippingAddress = formatAddress(order.shippingAddress);
  const billingAddress = order.billingAddress
    ? formatAddress(order.billingAddress)
    : shippingAddress; // Fallback to shipping address if no billing address

  return {
    shippingAddress,
    billingAddress,
  };
};
