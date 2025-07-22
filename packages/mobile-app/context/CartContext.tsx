//  "CartContext.tsx"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import { useCartState } from "@/hooks/useCartState";
import { CartItem, CartSummary } from "@/types/cart";
import React, { createContext, useContext } from "react";

// Re-export types for backward compatibility
export { CartItem, CartSummary };

// Context type definition
type CartContextType = {
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

// Create context
export const CartContext = createContext<CartContextType>({
  cartItems: [],
  summary: null,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
  isLoading: true,
  error: null,
});

// Context hook
export const useCart = () => useContext(CartContext);

// Context Provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const cartState = useCartState();

  return (
    <CartContext.Provider value={cartState}>{children}</CartContext.Provider>
  );
};
