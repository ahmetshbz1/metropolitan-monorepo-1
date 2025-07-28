//  "update-quantity.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { CartService } from '@/services/cartService';
import { CartStore, OptimisticUpdate } from '../types';
import { nanoid } from 'nanoid/non-secure';

export const createUpdateQuantityAction = (
  get: () => CartStore,
  set: (partial: Partial<CartStore>) => void
) => async (itemId: string, quantity: number) => {
  const state = get();
  
  // Find the item to update
  const item = state.items.find(item => item.id === itemId);
  if (!item) {
    console.error('Item not found:', itemId);
    return;
  }
  
  // Check if already updating
  if (state.isUpdatingQuantity[itemId]) {
    return;
  }
  
  // Set loading state
  set({
    isUpdatingQuantity: {
      ...state.isUpdatingQuantity,
      [itemId]: true,
    },
    error: null,
  });
  
  // Create optimistic update
  const optimisticId = nanoid();
  const optimisticUpdate: OptimisticUpdate = {
    id: optimisticId,
    type: 'update',
    timestamp: Date.now(),
    itemId,
    previousValue: item.quantity,
    newValue: quantity,
    status: 'pending',
  };
  
  // Apply optimistic update to UI
  const optimisticItems = state.items.map(cartItem =>
    cartItem.id === itemId
      ? { ...cartItem, quantity }
      : cartItem
  );
  
  set({
    items: optimisticItems,
    optimisticUpdates: [...state.optimisticUpdates, optimisticUpdate],
  });
  
  try {
    // Execute actual API call
    await CartService.updateQuantity(
      itemId,
      quantity,
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
    
    // Refresh cart to get accurate data (summary, discounts, etc.)
    await get().refreshCart();
    
  } catch (error: any) {
    console.error('Failed to update quantity:', error);
    
    // Rollback optimistic update
    const revertedItems = state.items.map(cartItem =>
      cartItem.id === itemId
        ? { ...cartItem, quantity: item.quantity }
        : cartItem
    );
    
    set({
      items: revertedItems,
      optimisticUpdates: state.optimisticUpdates.filter(
        update => update.id !== optimisticId
      ),
      error: error.response?.data?.message || 'Failed to update quantity',
    });
    
    // If offline, queue the action
    if (!navigator.onLine && state.offlineQueue) {
      state.offlineQueue.addAction({
        type: 'updateQuantity',
        payload: { itemId, quantity },
        maxRetries: 3,
      });
    }
  } finally {
    // Clear loading state
    set({
      isUpdatingQuantity: {
        ...state.isUpdatingQuantity,
        [itemId]: false,
      },
    });
  }
};