//  "cartSlice.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { StateCreator } from 'zustand';
import { EcommerceStore, CartSlice } from '../types';
import { 
  handleApiError, 
  generateTempId, 
  calculateOptimisticSummary, 
  mergeCartState,
  isNetworkError,
  storeData,
  retrieveData,
  StorageKeys
} from '../utils';
import api from '@/core/api';
import { CartItem, CartSummary } from '@metropolitan/shared';

export const createCartSlice: StateCreator<
  EcommerceStore,
  [],
  [],
  CartSlice & {
    addToCart: (productId: string, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    migrateGuestCart: (userId: string) => Promise<void>;
    syncCart: () => Promise<void>;
  }
> = (set, get) => ({
  // Cart state
  items: [],
  summary: null,
  loading: false,
  error: null,
  lastSynced: null,
  stockValidation: null,

  // Add to cart with optimistic updates
  addToCart: async (productId: string, quantity: number = 1) => {
    const tempId = generateTempId();
    const { isAuthenticated, guestId, token } = get();

    // Get product data for optimistic update (assuming product cache exists)
    const productCache = (get() as any).productCache || {};
    const product = productCache[productId];

    // Immediate UI feedback
    set((state) => ({
      items: [
        ...state.items,
        {
          id: tempId,
          productId,
          quantity,
          isOptimistic: true,
          product,
          userId: isAuthenticated ? get().user?.id : guestId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      summary: calculateOptimisticSummary([
        ...state.items,
        { 
          id: tempId, 
          productId, 
          quantity, 
          product,
          userId: isAuthenticated ? get().user?.id : guestId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
    }));

    try {
      const endpoint = isAuthenticated ? '/cart/add' : '/cart/guest/add';
      const payload = isAuthenticated 
        ? { productId, quantity }
        : { productId, quantity, guestId };

      const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.post(endpoint, payload, { headers });
      const { item, summary } = response.data;

      // Replace optimistic item with server response
      set((state) => ({
        items: state.items.map(i => 
          i.id === tempId ? item : i
        ),
        summary,
        lastSynced: new Date().toISOString(),
        error: null,
      }));

      // Store backup for offline recovery
      await storeData(StorageKeys.CART_BACKUP, {
        items: get().items,
        summary: get().summary,
        lastSynced: get().lastSynced,
      });

    } catch (error) {
      // Rollback optimistic update
      set((state) => ({
        items: state.items.filter(item => item.id !== tempId),
        summary: calculateOptimisticSummary(
          state.items.filter(item => item.id !== tempId)
        ),
        error: handleApiError(error),
      }));

      // Queue for retry if network error
      if (isNetworkError(error)) {
        get().queueOfflineAction({
          type: 'ADD_TO_CART',
          payload: { productId, quantity },
        });
      }
    }
  },

  // Update quantity with optimistic updates
  updateQuantity: async (itemId: string, quantity: number) => {
    const { isAuthenticated, guestId, token, items } = get();
    const previousItems = [...items];
    const previousSummary = get().summary;

    // Optimistic update
    set((state) => {
      const updatedItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      return {
        items: updatedItems,
        summary: calculateOptimisticSummary(updatedItems),
      };
    });

    try {
      const endpoint = isAuthenticated ? '/cart/update' : '/cart/guest/update';
      const payload = isAuthenticated 
        ? { itemId, quantity }
        : { itemId, quantity, guestId };

      const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.put(endpoint, payload, { headers });
      const { items: serverItems, summary } = response.data;

      set({
        items: serverItems,
        summary,
        lastSynced: new Date().toISOString(),
        error: null,
      });

      // Store backup
      await storeData(StorageKeys.CART_BACKUP, {
        items: serverItems,
        summary,
        lastSynced: get().lastSynced,
      });

    } catch (error) {
      // Rollback optimistic update
      set({
        items: previousItems,
        summary: previousSummary,
        error: handleApiError(error),
      });

      // Queue for retry if network error
      if (isNetworkError(error)) {
        get().queueOfflineAction({
          type: 'UPDATE_QUANTITY',
          payload: { itemId, quantity },
        });
      }
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId: string) => {
    const { isAuthenticated, guestId, token, items } = get();
    const previousItems = [...items];
    const previousSummary = get().summary;

    // Optimistic update
    set((state) => {
      const updatedItems = state.items.filter(item => item.id !== itemId);
      return {
        items: updatedItems,
        summary: calculateOptimisticSummary(updatedItems),
      };
    });

    try {
      const endpoint = isAuthenticated ? '/cart/remove' : '/cart/guest/remove';
      const payload = isAuthenticated 
        ? { itemId }
        : { itemId, guestId };

      const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};

      await api.delete(endpoint, { 
        headers,
        data: payload 
      });

      set({
        lastSynced: new Date().toISOString(),
        error: null,
      });

      // Store backup
      await storeData(StorageKeys.CART_BACKUP, {
        items: get().items,
        summary: get().summary,
        lastSynced: get().lastSynced,
      });

    } catch (error) {
      // Rollback optimistic update
      set({
        items: previousItems,
        summary: previousSummary,
        error: handleApiError(error),
      });

      // Queue for retry if network error
      if (isNetworkError(error)) {
        get().queueOfflineAction({
          type: 'REMOVE_FROM_CART',
          payload: { itemId },
        });
      }
    }
  },

  // Clear entire cart
  clearCart: async () => {
    const { isAuthenticated, guestId, token } = get();

    set({
      items: [],
      summary: null,
      error: null,
    });

    try {
      const endpoint = isAuthenticated ? '/cart/clear' : '/cart/guest/clear';
      const payload = isAuthenticated ? {} : { guestId };

      const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};

      await api.delete(endpoint, { 
        headers,
        data: payload 
      });

      set({
        lastSynced: new Date().toISOString(),
      });

      // Clear backup
      await storeData(StorageKeys.CART_BACKUP, {
        items: [],
        summary: null,
        lastSynced: get().lastSynced,
      });

    } catch (error) {
      console.warn('Failed to clear cart on server:', error);
      // Don't rollback for clear operation
    }
  },

  // Refresh cart from server
  refreshCart: async () => {
    const { isAuthenticated, guestId, token } = get();
    
    if (!isAuthenticated && !guestId) {
      set({ items: [], summary: null, loading: false });
      return;
    }

    set({ loading: true, error: null });

    try {
      const endpoint = isAuthenticated ? '/cart' : '/cart/guest';
      const params = isAuthenticated ? {} : { guestId };
      const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.get(endpoint, { params, headers });
      const { items, summary } = response.data;

      set({
        items,
        summary,
        loading: false,
        lastSynced: new Date().toISOString(),
        error: null,
      });

      // Store backup
      await storeData(StorageKeys.CART_BACKUP, {
        items,
        summary,
        lastSynced: get().lastSynced,
      });

    } catch (error) {
      // Try to load from backup on error
      const backup = await retrieveData(StorageKeys.CART_BACKUP);
      if (backup) {
        set({
          items: backup.items || [],
          summary: backup.summary,
          lastSynced: backup.lastSynced,
          loading: false,
          error: null,
        });
      } else {
        set({
          loading: false,
          error: handleApiError(error),
        });
      }
    }
  },

  // Migrate guest cart to user account
  migrateGuestCart: async (userId: string) => {
    const { guestId, items } = get();
    
    if (!guestId || items.length === 0) return;

    set({ loading: true });

    try {
      const response = await api.post('/cart/migrate', {
        guestId,
        userId,
      }, {
        headers: { Authorization: `Bearer ${get().token}` },
      });

      const { items: migratedItems, summary } = response.data;

      set({
        items: migratedItems,
        summary,
        loading: false,
        lastSynced: new Date().toISOString(),
        error: null,
      });

      // Store backup
      await storeData(StorageKeys.CART_BACKUP, {
        items: migratedItems,
        summary,
        lastSynced: get().lastSynced,
      });

    } catch (error) {
      set({
        loading: false,
        error: handleApiError(error),
      });
    }
  },

  // Background sync for cart state
  syncCart: async () => {
    const { isAuthenticated, guestId } = get();
    
    if (!isAuthenticated && !guestId) return;

    try {
      const endpoint = isAuthenticated ? '/cart' : '/cart/guest';
      const params = isAuthenticated ? {} : { guestId };
      const headers = isAuthenticated ? { Authorization: `Bearer ${get().token}` } : {};

      const response = await api.get(endpoint, { params, headers });
      const { items: serverItems, summary } = response.data;

      // Merge server state with any pending optimistic updates
      const mergedItems = mergeCartState(get().items, serverItems);

      set({
        items: mergedItems,
        summary,
        lastSynced: new Date().toISOString(),
        error: null,
      });

    } catch (error) {
      console.warn('Background cart sync failed:', error);
      // Don't set error for background sync
    }
  },
});