//  "store.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createStore } from '../shared/middleware';
import { createOfflineQueue } from '../shared/offline-queue';
import { StorageKeys } from '../shared/storage';
import { CartStore } from './types';
import { createAddToCartAction } from './actions/add-to-cart';
import { createUpdateQuantityAction } from './actions/update-quantity';
import { createRemoveItemAction } from './actions/remove-item';
import { createSyncActions } from './actions/sync';

// Initial state
const initialState: Omit<CartStore, 'offlineQueue'> = {
  // Data
  items: [],
  summary: null,
  
  // Loading states
  isLoading: true,
  error: null,
  isAddingToCart: {},
  isUpdatingQuantity: {},
  isRemovingItem: {},
  
  // Session
  guestId: null,
  isAuthenticated: false,
  
  // Sync state
  lastSyncTime: null,
  optimisticUpdates: [],
  
  // Placeholders for actions (will be overridden)
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
  setGuestId: () => {},
  setAuthenticated: () => {},
  migrateGuestCart: async () => {},
  syncWithBackend: async () => {},
  processOfflineQueue: async () => {},
  setItems: () => {},
  setSummary: () => {},
  setError: () => {},
  setLoading: () => {},
  addOptimisticUpdate: () => {},
  removeOptimisticUpdate: () => {},
  rollbackOptimisticUpdate: () => {},
};

// Create cart store
export const useCartStore = create<CartStore>()(
  subscribeWithSelector(
    createStore(
      'cart',
      (set, get) => {
        // Create offline queue
        const offlineQueue = createOfflineQueue(async (action) => {
          const state = get();
          
          try {
            switch (action.type) {
              case 'addToCart':
                await state.addToCart(action.payload.productId, action.payload.quantity);
                return true;
                
              case 'updateQuantity':
                await state.updateQuantity(action.payload.itemId, action.payload.quantity);
                return true;
                
              case 'removeItem':
                await state.removeItem(action.payload.itemId);
                return true;
                
              default:
                console.warn('Unknown offline action type:', action.type);
                return false;
            }
          } catch (error) {
            console.error('Failed to process offline action:', error);
            return false;
          }
        });
        
        // Create action functions
        const syncActions = createSyncActions(get, set);
        const addToCart = createAddToCartAction(get, set);
        const updateQuantity = createUpdateQuantityAction(get, set);
        const removeItem = createRemoveItemAction(get, set);
        
        return {
          ...initialState,
          offlineQueue,
          
          // Core actions
          addToCart,
          updateQuantity,
          removeItem,
          clearCart: syncActions.clearCart,
          refreshCart: syncActions.refreshCart,
          
          // Sync actions
          syncWithBackend: syncActions.syncWithBackend,
          migrateGuestCart: syncActions.migrateGuestCart,
          
          // Session management
          setGuestId: (guestId) => set({ guestId }),
          setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
          
          // State setters
          setItems: (items) => set({ items }),
          setSummary: (summary) => set({ summary }),
          setError: (error) => set({ error }),
          setLoading: (isLoading) => set({ isLoading }),
          
          // Optimistic update management
          addOptimisticUpdate: (update) => 
            set(state => ({ 
              optimisticUpdates: [...state.optimisticUpdates, update] 
            })),
            
          removeOptimisticUpdate: (id) =>
            set(state => ({
              optimisticUpdates: state.optimisticUpdates.filter(u => u.id !== id)
            })),
            
          rollbackOptimisticUpdate: (id) => {
            const state = get();
            const update = state.optimisticUpdates.find(u => u.id === id);
            
            if (!update) return;
            
            // Rollback the optimistic change
            switch (update.type) {
              case 'add':
                if (update.productId) {
                  set({
                    items: state.items.filter(item => 
                      item.productId !== update.productId || 
                      !item.id.startsWith('optimistic_')
                    ),
                  });
                }
                break;
                
              case 'update':
                if (update.itemId && update.previousValue !== undefined) {
                  set({
                    items: state.items.map(item =>
                      item.id === update.itemId
                        ? { ...item, quantity: update.previousValue }
                        : item
                    ),
                  });
                }
                break;
                
              case 'remove':
                if (update.previousValue) {
                  set({
                    items: [...state.items, update.previousValue],
                  });
                }
                break;
            }
            
            // Remove the update
            set({
              optimisticUpdates: state.optimisticUpdates.filter(u => u.id !== id)
            });
          },
          
          // Process offline queue
          processOfflineQueue: async () => {
            const state = get();
            if (state.offlineQueue) {
              await state.offlineQueue.processQueue();
            }
          },
        };
      },
      {
        key: StorageKeys.CART,
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle migration between versions
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              optimisticUpdates: [],
              lastSyncTime: null,
            };
          }
          return persistedState;
        },
      }
    )
  )
);