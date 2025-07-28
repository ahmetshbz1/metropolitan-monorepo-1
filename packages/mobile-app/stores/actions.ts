//  "actions.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { useEcommerceStore } from './index';
import { useCallback } from 'react';

// =============================================================================
// AUTH ACTIONS
// =============================================================================

export const useAuthActions = () => {
  const store = useEcommerceStore();
  
  return {
    sendOTP: useCallback(store.sendOTP, [store.sendOTP]),
    verifyOTP: useCallback(store.verifyOTP, [store.verifyOTP]),
    completeProfile: useCallback(store.completeProfile, [store.completeProfile]),
    updateUserProfile: useCallback(store.updateUserProfile, [store.updateUserProfile]),
    uploadProfilePhoto: useCallback(store.uploadProfilePhoto, [store.uploadProfilePhoto]),
    refreshUserProfile: useCallback(store.refreshUserProfile, [store.refreshUserProfile]),
    loginAsGuest: useCallback(store.loginAsGuest, [store.loginAsGuest]),
    logout: useCallback(store.logout, [store.logout]),
  };
};

// Individual action hooks for better performance
export const useSendOTP = () => useEcommerceStore(state => state.sendOTP);
export const useVerifyOTP = () => useEcommerceStore(state => state.verifyOTP);
export const useCompleteProfile = () => useEcommerceStore(state => state.completeProfile);
export const useUpdateProfile = () => useEcommerceStore(state => state.updateUserProfile);
export const useUploadPhoto = () => useEcommerceStore(state => state.uploadProfilePhoto);
export const useLoginAsGuest = () => useEcommerceStore(state => state.loginAsGuest);
export const useLogout = () => useEcommerceStore(state => state.logout);

// =============================================================================
// CART ACTIONS
// =============================================================================

export const useCartActions = () => {
  const store = useEcommerceStore();
  
  return {
    addToCart: useCallback(store.addToCart, [store.addToCart]),
    updateQuantity: useCallback(store.updateQuantity, [store.updateQuantity]),
    removeFromCart: useCallback(store.removeFromCart, [store.removeFromCart]),
    clearCart: useCallback(store.clearCart, [store.clearCart]),
    refreshCart: useCallback(store.refreshCart, [store.refreshCart]),
    migrateGuestCart: useCallback(store.migrateGuestCart, [store.migrateGuestCart]),
    syncCart: useCallback(store.syncCart, [store.syncCart]),
  };
};

// Individual cart action hooks
export const useAddToCart = () => useEcommerceStore(state => state.addToCart);
export const useUpdateQuantity = () => useEcommerceStore(state => state.updateQuantity);
export const useRemoveFromCart = () => useEcommerceStore(state => state.removeFromCart);
export const useClearCart = () => useEcommerceStore(state => state.clearCart);
export const useRefreshCart = () => useEcommerceStore(state => state.refreshCart);

// Optimized cart item actions
export const useCartItemActions = (itemId: string) => {
  const updateQuantity = useUpdateQuantity();
  const removeFromCart = useRemoveFromCart();
  
  return {
    updateQuantity: useCallback(
      (quantity: number) => updateQuantity(itemId, quantity),
      [updateQuantity, itemId]
    ),
    removeItem: useCallback(
      () => removeFromCart(itemId),
      [removeFromCart, itemId]
    ),
  };
};

// =============================================================================
// CHECKOUT ACTIONS
// =============================================================================

export const useCheckoutActions = () => {
  const store = useEcommerceStore();
  
  return {
    nextStep: useCallback(store.nextCheckoutStep, [store.nextCheckoutStep]),
    prevStep: useCallback(store.prevCheckoutStep, [store.prevCheckoutStep]),
    setDeliveryAddress: useCallback(store.setDeliveryAddress, [store.setDeliveryAddress]),
    setBillingAddress: useCallback(store.setBillingAddress, [store.setBillingAddress]),
    setPaymentMethod: useCallback(store.setPaymentMethod, [store.setPaymentMethod]),
    setNotes: useCallback(store.setCheckoutNotes, [store.setCheckoutNotes]),
    toggleTerms: useCallback(store.toggleTermsAgreement, [store.toggleTermsAgreement]),
    processOrder: useCallback(store.processOrder, [store.processOrder]),
    resetCheckout: useCallback(store.resetCheckout, [store.resetCheckout]),
    saveProgress: useCallback(store.saveCheckoutProgress, [store.saveCheckoutProgress]),
    restoreProgress: useCallback(store.restoreCheckoutProgress, [store.restoreCheckoutProgress]),
  };
};

// Individual checkout action hooks
export const useNextCheckoutStep = () => useEcommerceStore(state => state.nextCheckoutStep);
export const usePrevCheckoutStep = () => useEcommerceStore(state => state.prevCheckoutStep);
export const useSetDeliveryAddress = () => useEcommerceStore(state => state.setDeliveryAddress);
export const useSetBillingAddress = () => useEcommerceStore(state => state.setBillingAddress);
export const useSetPaymentMethod = () => useEcommerceStore(state => state.setPaymentMethod);
export const useProcessOrder = () => useEcommerceStore(state => state.processOrder);
export const useResetCheckout = () => useEcommerceStore(state => state.resetCheckout);

// =============================================================================
// ORDER ACTIONS
// =============================================================================

export const useOrderActions = () => {
  const store = useEcommerceStore();
  
  return {
    fetchOrders: useCallback(store.fetchOrders, [store.fetchOrders]),
    fetchOrderDetail: useCallback(store.fetchOrderDetail, [store.fetchOrderDetail]),
    reorderItems: useCallback(store.reorderItems, [store.reorderItems]),
  };
};

// Individual order action hooks
export const useFetchOrders = () => useEcommerceStore(state => state.fetchOrders);
export const useFetchOrderDetail = () => useEcommerceStore(state => state.fetchOrderDetail);
export const useReorderItems = () => useEcommerceStore(state => state.reorderItems);

// =============================================================================
// INVENTORY ACTIONS
// =============================================================================

export const useInventoryActions = () => {
  const store = useEcommerceStore();
  
  return {
    connectSocket: useCallback(store.connectInventorySocket, [store.connectInventorySocket]),
    validateStock: useCallback(store.validateCartStock, [store.validateCartStock]),
    handlePriceUpdates: useCallback(store.handlePriceUpdates, [store.handlePriceUpdates]),
  };
};

// Individual inventory action hooks
export const useConnectInventorySocket = () => useEcommerceStore(state => state.connectInventorySocket);
export const useValidateCartStock = () => useEcommerceStore(state => state.validateCartStock);

// =============================================================================
// OFFLINE ACTIONS
// =============================================================================

export const useOfflineActions = () => {
  const store = useEcommerceStore();
  
  return {
    queueAction: useCallback(store.queueOfflineAction, [store.queueOfflineAction]),
    processQueue: useCallback(store.processOfflineQueue, [store.processOfflineQueue]),
    setOnlineStatus: useCallback(store.setOnlineStatus, [store.setOnlineStatus]),
    initializeOfflineSupport: useCallback(store.initializeOfflineSupport, [store.initializeOfflineSupport]),
  };
};

// Individual offline action hooks
export const useQueueOfflineAction = () => useEcommerceStore(state => state.queueOfflineAction);
export const useProcessOfflineQueue = () => useEcommerceStore(state => state.processOfflineQueue);

// =============================================================================
// GLOBAL ACTIONS
// =============================================================================

export const useGlobalActions = () => {
  const store = useEcommerceStore();
  
  return {
    clearAllErrors: useCallback(store.clearAllErrors, [store.clearAllErrors]),
    resetStore: useCallback(store.resetStore, [store.resetStore]),
  };
};

// Individual global action hooks
export const useClearAllErrors = () => useEcommerceStore(state => state.clearAllErrors);
export const useResetStore = () => useEcommerceStore(state => state.resetStore);

// =============================================================================
// COMBINED ACTION HOOKS
// =============================================================================

// Common app actions
export const useAppActions = () => {
  const authActions = useAuthActions();
  const cartActions = useCartActions();
  const globalActions = useGlobalActions();
  
  return {
    ...authActions,
    ...cartActions,
    ...globalActions,
  };
};

// Quick add to cart with error handling
export const useQuickAddToCart = () => {
  const addToCart = useAddToCart();
  const clearErrors = useClearAllErrors();
  
  return useCallback(async (productId: string, quantity: number = 1) => {
    try {
      clearErrors();
      await addToCart(productId, quantity);
      return { success: true };
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return { success: false, error };
    }
  }, [addToCart, clearErrors]);
};

// Complete order flow
export const useCompleteOrder = () => {
  const processOrder = useProcessOrder();
  const clearCart = useClearCart();
  const resetCheckout = useResetCheckout();
  
  return useCallback(async () => {
    try {
      const result = await processOrder();
      
      if (result.success) {
        // Order processed successfully, cleanup is handled in processOrder
        return result;
      } else {
        return result;
      }
    } catch (error) {
      console.error('Order completion failed:', error);
      return { success: false, error };
    }
  }, [processOrder, clearCart, resetCheckout]);
};