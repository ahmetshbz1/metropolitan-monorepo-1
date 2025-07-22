// "cart.ts"
// metropolitan app
// Created by Ahmet on 15.07.2025.
import type { Product } from "./product";

export interface CartItem {
  id: string;
  quantity: number;

  /** Optional numeric string in responses. */
  totalPrice?: number | string;

  /** Time when the item was added (ISO string on client). */
  createdAt?: string;

  /** Full product snapshot at the time it was added to the cart. */
  product: Product;
}

export interface CartSummary {
  totalItems: number;
  totalAmount: number | string;
  currency?: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartOperationResponse {
  message: string;
  cartSummary: CartSummary;
  itemId?: string;
}
