//  "sync.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { CartService } from '@/services/cartService';
import { CartStore } from '../types';
import { useTranslation } from 'react-i18next';

export const createSyncActions = (
  get: () => CartStore,
  set: (partial: Partial<CartStore>) => void
) => {
  // Refresh cart from backend
  const refreshCart = async () => {
    const state = get();
    
    if (!state.isAuthenticated && !state.guestId) {
      set({
        items: [],
        summary: null,
        isLoading: false,
      });
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      const { items, summary } = await CartService.getCart(
        state.isAuthenticated,
        state.guestId || undefined
      );
      
      // Remove successful optimistic updates
      const pendingUpdates = state.optimisticUpdates.filter(
        update => update.status === 'pending'
      );
      
      set({
        items,
        summary,
        optimisticUpdates: pendingUpdates,
        lastSyncTime: Date.now(),
        isLoading: false,
      });
      
    } catch (error: any) {
      console.error('Failed to refresh cart:', error);
      
      set({
        error: error.response?.data?.message || 'Failed to load cart',
        isLoading: false,
      });
      
      // Keep existing data on error
    }
  };
  
  // Sync optimistic updates with backend
  const syncWithBackend = async () => {
    const state = get();
    
    // Process pending optimistic updates
    const pendingUpdates = state.optimisticUpdates.filter(
      update => update.status === 'pending'
    );
    
    for (const update of pendingUpdates) {
      try {
        switch (update.type) {
          case 'add':
            if (update.productId && update.newValue) {
              await CartService.addToCart(
                update.productId,
                update.newValue.quantity,
                state.isAuthenticated,
                state.guestId || undefined
              );
            }
            break;
            
          case 'update':
            if (update.itemId && update.newValue) {
              await CartService.updateQuantity(
                update.itemId,
                update.newValue,
                state.isAuthenticated,
                state.guestId || undefined
              );
            }
            break;
            
          case 'remove':
            if (update.itemId) {
              await CartService.removeItem(
                update.itemId,
                state.isAuthenticated,
                state.guestId || undefined
              );
            }
            break;
        }
        
        // Mark as successful
        set({
          optimisticUpdates: state.optimisticUpdates.map(u =>
            u.id === update.id ? { ...u, status: 'success' as const } : u
          ),
        });
        
      } catch (error) {
        console.error('Failed to sync update:', update, error);
        
        // Mark as failed
        set({
          optimisticUpdates: state.optimisticUpdates.map(u =>
            u.id === update.id ? { ...u, status: 'failed' as const } : u
          ),
        });
      }
    }
    
    // Clean up successful updates and refresh
    await refreshCart();
  };
  
  // Clear cart
  const clearCart = async () => {
    const state = get();
    
    try {
      set({ isLoading: true, error: null });
      
      await CartService.clearCart(
        state.isAuthenticated,
        state.guestId || undefined
      );
      
      set({
        items: [],
        summary: null,
        optimisticUpdates: [],
        isLoading: false,
      });
      
    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      
      set({
        error: error.response?.data?.message || 'Failed to clear cart',
        isLoading: false,
      });
    }
  };
  
  // Migrate guest cart to user account on login
  const migrateGuestCart = async () => {
    const state = get();
    
    if (!state.guestId || state.isAuthenticated) {
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      await CartService.migrateGuestCart(state.guestId);
      
      // Clear guest ID and refresh as authenticated user
      set({ guestId: null, isAuthenticated: true });
      await refreshCart();
      
    } catch (error: any) {
      console.error('Failed to migrate guest cart:', error);
      
      set({
        error: error.response?.data?.message || 'Failed to migrate cart',
        isLoading: false,
      });
    }
  };
  
  return {
    refreshCart,
    syncWithBackend,
    clearCart,
    migrateGuestCart,
  };
};