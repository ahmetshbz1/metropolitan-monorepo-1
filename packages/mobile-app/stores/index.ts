//  "index.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.
//
//  Main store index file for initializing and exporting all stores

import React from 'react';
import { useAuthStore } from './auth/store';
import { useCartStore } from './cart/store';

// Export all stores
export { useAuthStore } from './auth/store';
export { useCartStore } from './cart/store';

// Export all hooks
export { useAuth, useOTPStatus, useProfileUpdateStatus, useSessionInfo, useUserDisplay } from './auth/hooks';
export { useCart, useCartSummary, useCartStatus, useCartItemsWithStates, useCartItem, useIsAddingToCart } from './cart/hooks';

// Export migration hooks for backward compatibility
export { useAuth as useMigrationAuth, useCart as useMigrationCart } from './migration/migration-hooks';

// Export types
export type { AuthStore } from './auth/types';
export type { CartStore } from './cart/types';

// Store initialization function
export const initializeStores = async () => {
  console.log('[Stores] Initializing Zustand stores...');
  
  try {
    // Initialize auth store
    const authStore = useAuthStore.getState();
    
    // Check if user has stored session and refresh if needed
    if (authStore.token && !authStore.user) {
      console.log('[Auth] Refreshing user profile from stored token...');
      await authStore.refreshUserProfile();
    }
    
    // Initialize guest session if no user session
    if (!authStore.token && !authStore.isGuest) {
      console.log('[Auth] Creating guest session...');
      await authStore.loginAsGuest();
    }
    
    // Initialize cart store
    const cartStore = useCartStore.getState();
    
    // Set auth state in cart store
    cartStore.setAuthenticated(!!authStore.user);
    cartStore.setGuestId(authStore.guestId);
    
    // Load cart data
    console.log('[Cart] Loading cart data...');
    await cartStore.refreshCart();
    
    // Process any pending offline actions
    if (cartStore.offlineQueue) {
      await cartStore.processOfflineQueue();
    }
    
    console.log('[Stores] Store initialization completed successfully');
    
    return { success: true };
    
  } catch (error) {
    console.error('[Stores] Failed to initialize stores:', error);
    return { success: false, error };
  }
};

// Store synchronization function to keep stores in sync
export const synchronizeStores = () => {
  // Subscribe to auth changes and update cart store
  useAuthStore.subscribe(
    (state) => ({
      isAuthenticated: !!state.user,
      guestId: state.guestId,
    }),
    (authState) => {
      const cartStore = useCartStore.getState();
      
      // Update cart store with auth state
      if (cartStore.isAuthenticated !== authState.isAuthenticated) {
        cartStore.setAuthenticated(authState.isAuthenticated);
        
        // If user logged in, migrate guest cart
        if (authState.isAuthenticated && cartStore.guestId) {
          cartStore.migrateGuestCart();
        }
      }
      
      if (cartStore.guestId !== authState.guestId) {
        cartStore.setGuestId(authState.guestId);
      }
    }
  );
  
  // Subscribe to cart changes for performance monitoring
  if (__DEV__) {
    useCartStore.subscribe(
      (state) => state.items.length,
      (itemCount, previousItemCount) => {
        if (itemCount !== previousItemCount) {
          console.log(`[Cart] Item count changed: ${previousItemCount} -> ${itemCount}`);
        }
      }
    );
  }
};

// Performance monitoring for store renders
export const useStorePerformanceMonitor = () => {
  if (!__DEV__) return null;
  
  const authRenderCount = React.useRef(0);
  const cartRenderCount = React.useRef(0);
  
  // Monitor auth store renders
  useAuthStore((state) => {
    authRenderCount.current++;
    return state.user;
  });
  
  // Monitor cart store renders
  useCartStore((state) => {
    cartRenderCount.current++;
    return state.items;
  });
  
  return {
    authRenderCount: authRenderCount.current,
    cartRenderCount: cartRenderCount.current,
    getTotalRenders: () => authRenderCount.current + cartRenderCount.current,
    reset: () => {
      authRenderCount.current = 0;
      cartRenderCount.current = 0;
    },
  };
};

// Error boundary integration for stores
export const handleStoreError = (error: Error, errorInfo: any) => {
  console.error('[Stores] Store error:', error, errorInfo);
  
  // Reset stores to safe state on critical errors
  if (error.message.includes('JSON') || error.message.includes('storage')) {
    console.log('[Stores] Resetting stores due to storage error...');
    
    // Reset auth store
    useAuthStore.getState().logout();
    
    // Reset cart store
    useCartStore.getState().clearCart();
  }
};