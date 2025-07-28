//  "types.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { CartItem, CartSummary } from '@metropolitan/shared';
import { AsyncState, OfflineQueue } from '../shared/types';

// Cart store state
export interface CartState extends AsyncState {
  // Data
  items: CartItem[];
  summary: CartSummary | null;
  
  // UI state
  isAddingToCart: { [productId: string]: boolean };
  isUpdatingQuantity: { [itemId: string]: boolean };
  isRemovingItem: { [itemId: string]: boolean };
  
  // Session info
  guestId: string | null;
  isAuthenticated: boolean;
  
  // Offline support
  offlineQueue: OfflineQueue | null;
  lastSyncTime: number | null;
  
  // Optimistic updates
  optimisticUpdates: OptimisticUpdate[];
}

// Cart actions
export interface CartActions {
  // Core actions
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  
  // Session management
  setGuestId: (guestId: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  migrateGuestCart: () => Promise<void>;
  
  // Sync actions
  syncWithBackend: () => Promise<void>;
  processOfflineQueue: () => Promise<void>;
  
  // State setters
  setItems: (items: CartItem[]) => void;
  setSummary: (summary: CartSummary | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  
  // Optimistic updates
  addOptimisticUpdate: (update: OptimisticUpdate) => void;
  removeOptimisticUpdate: (id: string) => void;
  rollbackOptimisticUpdate: (id: string) => void;
}

// Combined store type
export type CartStore = CartState & CartActions;

// Optimistic update tracking
export interface OptimisticUpdate {
  id: string;
  type: 'add' | 'update' | 'remove';
  timestamp: number;
  itemId?: string;
  productId?: string;
  previousValue?: any;
  newValue?: any;
  status: 'pending' | 'success' | 'failed';
}

// Selectors return types
export interface CartSelectors {
  getItemById: (id: string) => CartItem | undefined;
  getItemByProductId: (productId: string) => CartItem | undefined;
  getTotalItems: () => number;
  getTotalQuantity: () => number;
  getSubtotal: () => number;
  isCartEmpty: () => boolean;
  hasUnsyncedChanges: () => boolean;
  getItemsWithProducts: () => Array<CartItem & { isLoading?: boolean }>;
}