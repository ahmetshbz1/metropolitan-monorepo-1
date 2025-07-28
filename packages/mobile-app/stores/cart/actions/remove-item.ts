//  "remove-item.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { CartService } from '@/services/cartService';
import { CartStore, OptimisticUpdate } from '../types';
import { nanoid } from 'nanoid/non-secure';

export const createRemoveItemAction = (
  get: () => CartStore,
  set: (partial: Partial<CartStore>) => void
) => async (itemId: string) => {
  const state = get();
  
  // Find the item to remove
  const item = state.items.find(item => item.id === itemId);
  if (!item) {
    console.error('Item not found:', itemId);
    return;
  }
  
  // Check if already removing
  if (state.isRemovingItem[itemId]) {
    return;
  }
  
  // Set loading state
  set({
    isRemovingItem: {
      ...state.isRemovingItem,
      [itemId]: true,
    },
    error: null,
  });
  
  // Create optimistic update
  const optimisticId = nanoid();
  const optimisticUpdate: OptimisticUpdate = {
    id: optimisticId,
    type: 'remove',
    timestamp: Date.now(),
    itemId,
    previousValue: item,
    status: 'pending',
  };
  
  // Apply optimistic update to UI (remove item)
  const optimisticItems = state.items.filter(cartItem => cartItem.id !== itemId);
  
  set({
    items: optimisticItems,
    optimisticUpdates: [...state.optimisticUpdates, optimisticUpdate],
  });
  
  try {
    // Execute actual API call
    await CartService.removeItem(
      itemId,
      state.isAuthenticated,
      state.guestId || undefined
    );
    
    // Mark optimistic update as success
    set({
      optimisticUpdates: state.optimisticUpdates.map(update =>
        update.id === optimisticId
          ? { ...update, status: 'success' as const }
          : update
      ),
    });
    
    // Refresh cart to get accurate summary
    await get().refreshCart();
    
  } catch (error: any) {
    console.error('Failed to remove item:', error);
    
    // Rollback optimistic update (restore item)
    set({
      items: [...state.items, item],
      optimisticUpdates: state.optimisticUpdates.filter(
        update => update.id !== optimisticId
      ),
      error: error.response?.data?.message || 'Failed to remove item',
    });
    
    // If offline, queue the action
    if (!navigator.onLine && state.offlineQueue) {
      state.offlineQueue.addAction({
        type: 'removeItem',
        payload: { itemId },
        maxRetries: 3,
      });
    }
  } finally {
    // Clear loading state
    set({
      isRemovingItem: {
        ...state.isRemovingItem,
        [itemId]: false,
      },
    });
  }
};