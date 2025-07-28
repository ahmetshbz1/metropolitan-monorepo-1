//  "hooks.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useCartStore } from './store';
import {
  selectItems,
  selectSummary,
  selectIsLoading,
  selectError,
  selectCartSummary,
  selectCartStatus,
  selectItemsWithLoadingStates,
  selectIsAddingToCart,
  selectIsUpdatingQuantity,
  selectIsRemovingItem,
  selectSessionStatus,
} from './selectors';
import { shallow } from '../shared/selectors';

// Main cart hook - compatible with existing Context API
export const useCart = () => {
  const store = useCartStore();
  
  // Subscribe to specific slices to prevent unnecessary re-renders
  const items = useCartStore(selectItems, shallow);
  const summary = useCartStore(selectSummary);
  const isLoading = useCartStore(selectIsLoading);
  const error = useCartStore(selectError);
  const cartStatus = useCartStore(selectCartStatus, shallow);
  
  // Handle app state changes for background sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App became active, process offline queue and sync
        store.processOfflineQueue();
        store.syncWithBackend();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [store]);
  
  return {
    cartItems: items,
    summary,
    isLoading,
    error,
    
    // Actions
    addToCart: store.addToCart,
    updateQuantity: store.updateQuantity,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
    refreshCart: store.refreshCart,
    
    // Additional Zustand features
    syncWithBackend: store.syncWithBackend,
    hasUnsyncedChanges: cartStatus.hasUnsyncedChanges,
  };
};

// Hook for cart summary with computed values
export const useCartSummary = () => {
  return useCartStore(selectCartSummary, shallow);
};

// Hook for cart status (loading, error, sync state)
export const useCartStatus = () => {
  return useCartStore(selectCartStatus, shallow);
};

// Hook for items with loading states
export const useCartItemsWithStates = () => {
  return useCartStore(selectItemsWithLoadingStates, shallow);
};

// Hook for specific item by ID
export const useCartItem = (itemId: string) => {
  const getItem = useCallback(
    (state: any) => state.items.find((item: any) => item.id === itemId),
    [itemId]
  );
  
  const item = useCartStore(getItem);
  const isUpdating = useCartStore(selectIsUpdatingQuantity(itemId));
  const isRemoving = useCartStore(selectIsRemovingItem(itemId));
  
  return {
    item,
    isUpdating,
    isRemoving,
  };
};

// Hook for checking if product is being added to cart
export const useIsAddingToCart = (productId: string) => {
  return useCartStore(selectIsAddingToCart(productId));
};

// Hook for session management
export const useCartSession = () => {
  const sessionStatus = useCartStore(selectSessionStatus, shallow);
  const store = useCartStore();
  
  return {
    ...sessionStatus,
    setGuestId: store.setGuestId,
    setAuthenticated: store.setAuthenticated,
    migrateGuestCart: store.migrateGuestCart,
  };
};

// Hook for offline functionality
export const useCartOffline = () => {
  const store = useCartStore();
  
  const offlineStatus = useCartStore(
    useCallback(
      (state) => ({
        hasOfflineActions: state.offlineQueue?.actions.length > 0,
        isProcessingQueue: state.offlineQueue?.isProcessing || false,
        lastSyncTime: state.lastSyncTime,
      }),
      []
    ),
    shallow
  );
  
  return {
    ...offlineStatus,
    processOfflineQueue: store.processOfflineQueue,
    syncWithBackend: store.syncWithBackend,
  };
};

// Performance monitoring hook
export const useCartPerformance = () => {
  const store = useCartStore();
  
  return useCartStore(
    useCallback(
      (state) => ({
        totalItems: state.items.length,
        optimisticUpdatesCount: state.optimisticUpdates.length,
        hasError: !!state.error,
        isLoading: state.isLoading,
      }),
      []
    ),
    shallow
  );
};

// Selective subscription hooks for optimization
export const useCartItemCount = () => {
  return useCartStore(
    useCallback((state) => state.items.length, [])
  );
};

export const useCartTotal = () => {
  return useCartStore(
    useCallback((state) => state.summary?.total || 0, [])
  );
};

export const useCartSubtotal = () => {
  return useCartStore(
    useCallback(
      (state) => state.items.reduce((total, item) => total + (item.price * item.quantity), 0),
      []
    )
  );
};