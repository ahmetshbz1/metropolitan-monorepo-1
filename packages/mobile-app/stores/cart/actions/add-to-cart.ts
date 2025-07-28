//  "add-to-cart.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { CartService } from '@/services/cartService';
import { CartStore, OptimisticUpdate } from '../types';
import { nanoid } from 'nanoid/non-secure';

export const createAddToCartAction = (
  get: () => CartStore,
  set: (partial: Partial<CartStore>) => void
) => async (productId: string, quantity: number = 1) => {
  const state = get();
  
  // Check if already adding
  if (state.isAddingToCart[productId]) {
    return;
  }
  
  // Set loading state
  set({
    isAddingToCart: {
      ...state.isAddingToCart,
      [productId]: true,
    },
    error: null,
  });
  
  // Create optimistic update
  const optimisticId = nanoid();
  const optimisticUpdate: OptimisticUpdate = {
    id: optimisticId,
    type: 'add',
    timestamp: Date.now(),
    productId,
    newValue: { productId, quantity },
    status: 'pending',
  };
  
  // Add optimistic update to UI
  const existingItem = state.items.find(item => item.productId === productId);
  let optimisticItems = [...state.items];
  
  if (existingItem) {
    // Update existing item
    optimisticItems = optimisticItems.map(item =>
      item.productId === productId
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    // Add new item (simplified structure for optimistic UI)
    optimisticItems.push({
      id: `optimistic_${productId}`,
      productId,
      quantity,
      price: 0, // Will be updated when sync completes
      // Add other required fields with placeholder values
    } as any);
  }
  
  set({
    items: optimisticItems,
    optimisticUpdates: [...state.optimisticUpdates, optimisticUpdate],
  });
  
  try {
    // Execute actual API call
    await CartService.addToCart(
      productId,
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
    
    // Refresh cart to get accurate data
    await get().refreshCart();
    
  } catch (error: any) {
    console.error('Failed to add item to cart:', error);
    
    // Rollback optimistic update
    set({
      items: state.items, // Revert to original state
      optimisticUpdates: state.optimisticUpdates.filter(
        update => update.id !== optimisticId
      ),
      error: error.response?.data?.message || 'Failed to add item to cart',
    });
    
    // If offline, queue the action
    if (!navigator.onLine && state.offlineQueue) {
      state.offlineQueue.addAction({
        type: 'addToCart',
        payload: { productId, quantity },
        maxRetries: 3,
      });
    }
  } finally {
    // Clear loading state
    set({
      isAddingToCart: {
        ...state.isAddingToCart,
        [productId]: false,
      },
    });
  }
};