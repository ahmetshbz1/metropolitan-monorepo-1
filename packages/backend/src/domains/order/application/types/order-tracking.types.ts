//  "order-tracking.types.ts"
//  metropolitan backend
//  Created by Ahmet on 15.06.2025.

/**
 * Flat query sonuçları için tip tanımı
 */
export type OrderQueryResult = {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  trackingNumber: string | null;
  shippingCompany: string | null;
  estimatedDelivery: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  paymentStatus: string;
  paymentMethodType: string | null;
  addressTitle: string;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
  itemId: string | null;
  itemQuantity: number | null;
  itemUnitPrice: string | null;
  itemTotalPrice: string | null;
  productId: string | null;
  productCode: string | null;
  productBrand: string | null;
  productSize: string | null;
  productImageUrl: string | null;
};

/**
 * Nested order response tipi
 */
export type OrderWithItems = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  trackingNumber: string | null;
  shippingCompany: string | null;
  estimatedDelivery: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  paymentStatus: string;
  paymentMethodType: string | null;
  shippingAddress: {
    addressTitle: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    product: {
      id: string;
      productCode: string;
      brand: string;
      size: string;
      imageUrl: string;
    } | null;
  }>;
};
