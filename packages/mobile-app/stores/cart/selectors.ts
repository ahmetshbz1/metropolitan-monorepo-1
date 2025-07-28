//  "selectors.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { CartStore, CartSelectors } from './types';
import { createSelector, createComputedSelector, shallow } from '../shared/selectors';

// Basic selectors
export const selectItems = (state: CartStore) => state.items;
export const selectSummary = (state: CartStore) => state.summary;
export const selectIsLoading = (state: CartStore) => state.isLoading;
export const selectError = (state: CartStore) => state.error;
export const selectIsAuthenticated = (state: CartStore) => state.isAuthenticated;
export const selectGuestId = (state: CartStore) => state.guestId;

// Computed selectors
export const selectItemById = createSelector(
  (state: CartStore, id: string) => 
    state.items.find(item => item.id === id)
);

export const selectItemByProductId = createSelector(
  (state: CartStore, productId: string) =>
    state.items.find(item => item.productId === productId)
);

export const selectTotalItems = createSelector(
  (state: CartStore) => state.items.length
);

export const selectTotalQuantity = createSelector(
  (state: CartStore) => 
    state.items.reduce((total, item) => total + item.quantity, 0)
);

export const selectSubtotal = createSelector(
  (state: CartStore) => 
    state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
);

export const selectIsCartEmpty = createSelector(
  (state: CartStore) => state.items.length === 0
);

export const selectHasUnsyncedChanges = createSelector(
  (state: CartStore) => 
    state.optimisticUpdates.some(update => update.status === 'pending')
);

// Loading state selectors
export const selectIsAddingToCart = (productId: string) => 
  createSelector((state: CartStore) => state.isAddingToCart[productId] || false);

export const selectIsUpdatingQuantity = (itemId: string) => 
  createSelector((state: CartStore) => state.isUpdatingQuantity[itemId] || false);

export const selectIsRemovingItem = (itemId: string) => 
  createSelector((state: CartStore) => state.isRemovingItem[itemId] || false);

// Complex computed selectors
export const selectCartSummary = createComputedSelector(
  [selectItems, selectSummary] as const,
  (items, summary) => ({
    itemCount: items.length,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + (item.price * item.quantity), 0),
    shipping: summary?.shipping || 0,
    tax: summary?.tax || 0,
    discount: summary?.discount || 0,
    total: summary?.total || 0,
  }),
  shallow
);

export const selectCartStatus = createComputedSelector(
  [selectIsLoading, selectError, selectHasUnsyncedChanges] as const,
  (isLoading, error, hasUnsyncedChanges) => ({
    isLoading,
    error,
    hasUnsyncedChanges,
    isReady: !isLoading && !error,
  }),
  shallow
);

// Items with loading states
export const selectItemsWithLoadingStates = createSelector(
  (state: CartStore) => 
    state.items.map(item => ({
      ...item,
      isUpdating: state.isUpdatingQuantity[item.id] || false,
      isRemoving: state.isRemovingItem[item.id] || false,
    })),
  shallow
);

// Optimistic updates status
export const selectOptimisticStatus = createSelector(
  (state: CartStore) => ({
    pendingCount: state.optimisticUpdates.filter(u => u.status === 'pending').length,
    failedCount: state.optimisticUpdates.filter(u => u.status === 'failed').length,
    hasOptimisticUpdates: state.optimisticUpdates.length > 0,
  }),
  shallow
);

// Session status
export const selectSessionStatus = createComputedSelector(
  [selectIsAuthenticated, selectGuestId] as const,
  (isAuthenticated, guestId) => ({
    isAuthenticated,
    hasGuestSession: !!guestId,
    hasValidSession: isAuthenticated || !!guestId,
    sessionType: isAuthenticated ? 'user' : guestId ? 'guest' : 'none',
  }),
  shallow
);

// Factory function to create bound selectors
export const createCartSelectors = (useStore: () => CartStore): CartSelectors => ({
  getItemById: (id: string) => {
    const state = useStore();
    return selectItemById(state, id);
  },
  
  getItemByProductId: (productId: string) => {
    const state = useStore();
    return selectItemByProductId(state, productId);
  },
  
  getTotalItems: () => {
    const state = useStore();
    return selectTotalItems(state);
  },
  
  getTotalQuantity: () => {
    const state = useStore();
    return selectTotalQuantity(state);
  },
  
  getSubtotal: () => {
    const state = useStore();
    return selectSubtotal(state);
  },
  
  isCartEmpty: () => {
    const state = useStore();
    return selectIsCartEmpty(state);
  },
  
  hasUnsyncedChanges: () => {
    const state = useStore();
    return selectHasUnsyncedChanges(state);
  },
  
  getItemsWithProducts: () => {
    const state = useStore();
    return selectItemsWithLoadingStates(state);
  },
});