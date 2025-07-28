//  "cart.ts"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

// Re-export shared types for convenience
export type { CartItem, CartSummary } from "@metropolitan/shared";
import type { CartItem, CartSummary } from "@metropolitan/shared";

// Context type definition
export type CartContextType = {
  cartItems: CartItem[];
  summary: CartSummary | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

// API response types
export type UserCartResponse = {
  items: CartItem[];
  summary: CartSummary;
};

export type GuestCartResponse = {
  success: boolean;
  data: {
    items: CartItem[];
    totalAmount: string | number;
    itemCount: number;
    currency: string;
  };
};
