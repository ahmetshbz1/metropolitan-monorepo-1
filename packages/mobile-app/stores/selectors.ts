//  "selectors.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { useEcommerceStore } from './index';
import type { EcommerceStore } from './types';
import { useMemo } from 'react';

// =============================================================================
// AUTH SELECTORS
// =============================================================================

export const useAuthState = () => useEcommerceStore(state => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
  isGuest: state.isGuest,
  guestId: state.guestId,
  phoneNumber: state.phoneNumber,
  loading: state.loading,
  error: state.error,
}));

export const useUser = () => useEcommerceStore(state => state.user);
export const useIsAuthenticated = () => useEcommerceStore(state => state.isAuthenticated);
export const useIsGuest = () => useEcommerceStore(state => state.isGuest);
export const useAuthLoading = () => useEcommerceStore(state => state.loading);
export const useAuthError = () => useEcommerceStore(state => state.error);

// =============================================================================
// CART SELECTORS
// =============================================================================

export const useCartState = () => useEcommerceStore(state => ({
  items: state.items,
  summary: state.summary,
  loading: state.loading,
  error: state.error,
  lastSynced: state.lastSynced,
  stockValidation: state.stockValidation,
}));

export const useCartItems = () => useEcommerceStore(state => state.items);
export const useCartSummary = () => useEcommerceStore(state => state.summary);
export const useCartLoading = () => useEcommerceStore(state => state.loading);
export const useCartError = () => useEcommerceStore(state => state.error);

// Optimized selector for individual cart item
export const useCartItem = (itemId: string) => 
  useEcommerceStore(state => 
    state.items.find(item => item.id === itemId)
  );

// Memoized cart calculations
export const useCartCalculations = () => {
  const summary = useCartSummary();
  const items = useCartItems();
  
  return useMemo(() => ({
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    uniqueItemCount: items.length,
    hasItems: items.length > 0,
    isValidForCheckout: items.length > 0 && summary?.total && summary.total > 0,
    subtotal: summary?.subtotal || 0,
    total: summary?.total || 0,
    shippingCost: summary?.shippingCost || 0,
    tax: summary?.tax || 0,
  }), [items, summary]);
};

// =============================================================================
// CHECKOUT SELECTORS
// =============================================================================

export const useCheckoutState = () => useEcommerceStore(state => ({
  currentStep: state.currentStep,
  totalSteps: state.totalSteps,
  deliveryAddress: state.deliveryAddress,
  billingAddress: state.billingAddress,
  billingAddressSameAsDelivery: state.billingAddressSameAsDelivery,
  selectedPaymentMethod: state.selectedPaymentMethod,
  paymentMethods: state.paymentMethods,
  agreedToTerms: state.agreedToTerms,
  notes: state.notes,
  processing: state.processing,
  error: state.error,
}));

export const useCheckoutStep = () => useEcommerceStore(state => state.currentStep);
export const useCheckoutProgress = () => useEcommerceStore(state => 
  (state.currentStep / state.totalSteps) * 100
);
export const useDeliveryAddress = () => useEcommerceStore(state => state.deliveryAddress);
export const useBillingAddress = () => useEcommerceStore(state => state.billingAddress);
export const useSelectedPaymentMethod = () => useEcommerceStore(state => state.selectedPaymentMethod);
export const useCheckoutProcessing = () => useEcommerceStore(state => state.processing);

// Checkout validation
export const useCheckoutValidation = () => {
  const state = useCheckoutState();
  
  return useMemo(() => ({
    isStep1Valid: state.deliveryAddress !== null,
    isStep2Valid: state.selectedPaymentMethod !== null,
    isStep3Valid: state.agreedToTerms,
    canProceedToNext: (() => {
      switch (state.currentStep) {
        case 1: return state.deliveryAddress !== null;
        case 2: return state.selectedPaymentMethod !== null;
        case 3: return state.agreedToTerms;
        default: return false;
      }
    })(),
    isReadyToProcess: state.deliveryAddress && state.selectedPaymentMethod && state.agreedToTerms,
  }), [state]);
};

// =============================================================================
// ORDER SELECTORS
// =============================================================================

export const useOrderState = () => useEcommerceStore(state => ({
  orders: state.orders,
  selectedOrder: state.selectedOrder,
  loading: state.loading,
  error: state.error,
  hasMore: state.hasMore,
  page: state.page,
}));

export const useOrders = () => useEcommerceStore(state => state.orders);
export const useSelectedOrder = () => useEcommerceStore(state => state.selectedOrder);
export const useOrdersLoading = () => useEcommerceStore(state => state.loading);
export const useOrdersHasMore = () => useEcommerceStore(state => state.hasMore);

// Find specific order
export const useOrder = (orderId: string) => 
  useEcommerceStore(state => 
    state.orders.find(order => order.id === orderId)
  );

// =============================================================================
// INVENTORY SELECTORS
// =============================================================================

export const useInventoryState = () => useEcommerceStore(state => ({
  stockLevels: state.stockLevels,
  reservations: state.reservations,
  priceUpdates: state.priceUpdates,
  connected: state.connected,
}));

export const useStockLevel = (productId: string) => 
  useEcommerceStore(state => state.stockLevels[productId]);

export const usePriceUpdate = (productId: string) => 
  useEcommerceStore(state => state.priceUpdates[productId]);

export const useInventoryConnected = () => useEcommerceStore(state => state.connected);

// =============================================================================
// OFFLINE SELECTORS
// =============================================================================

export const useOfflineState = () => useEcommerceStore(state => ({
  offlineQueue: state.offlineQueue,
  isOnline: state.isOnline,
}));

export const useIsOnline = () => useEcommerceStore(state => state.isOnline);
export const useOfflineQueueCount = () => useEcommerceStore(state => state.offlineQueue.length);
export const useHasPendingActions = () => useEcommerceStore(state => state.offlineQueue.length > 0);

// =============================================================================
// COMBINED SELECTORS
// =============================================================================

// App state overview
export const useAppState = () => {
  const auth = useAuthState();
  const cart = useCartCalculations();
  const checkout = useCheckoutState();
  const offline = useOfflineState();
  
  return useMemo(() => ({
    isReady: !auth.loading,
    isAuthenticated: auth.isAuthenticated,
    cartItemCount: cart.itemCount,
    checkoutStep: checkout.currentStep,
    isOnline: offline.isOnline,
    hasPendingActions: offline.offlineQueue.length > 0,
    hasErrors: !!(auth.error || cart.error || checkout.error),
  }), [auth, cart, checkout, offline]);
};

// Navigation readiness
export const useNavigationState = () => {
  const { isAuthenticated, isGuest } = useAuthState();
  const { hasItems } = useCartCalculations();
  
  return useMemo(() => ({
    showOnboarding: !isAuthenticated && !isGuest,
    showMainTabs: isAuthenticated || isGuest,
    showCheckout: hasItems,
    showAuthFlow: !isAuthenticated && !isGuest,
  }), [isAuthenticated, isGuest, hasItems]);
};