//  "useCartState.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { useCartData } from "./cart/useCartData";
import { useCartActions } from "./cart/useCartActions";

export const useCartState = () => {
  const cartData = useCartData();
  const actions = useCartActions({
    refreshCart: cartData.refreshCart,
    setError: cartData.setError,
    setCartItems: cartData.setCartItems,
    setSummary: cartData.setSummary,
    isAuthenticated: cartData.isAuthenticated,
    hasValidSession: cartData.hasValidSession,
    guestId: cartData.guestId,
    cartItems: cartData.cartItems,
  });

  return {
    cartItems: cartData.cartItems,
    summary: cartData.summary,
    isLoading: cartData.isLoading,
    error: cartData.error,
    refreshCart: cartData.refreshCart,
    ...actions,
  };
};
