import { create } from 'zustand';
import type { CartItem, CartSummary as SharedCartSummary } from '@metropolitan/shared';

interface CartState {
  items: CartItem[];
  summary: SharedCartSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCart: (items: CartItem[], summary: SharedCartSummary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCart: () => void;

  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  summary: null,
  isLoading: false,
  error: null,

  setCart: (items, summary) => set({ items, summary }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearCart: () => set({ items: [], summary: null }),

  getTotalItems: () => {
    const state = get();
    return state.summary?.totalItems ?? 0;
  },

  getTotalPrice: () => {
    const state = get();
    const totalAmount = state.summary?.totalAmount ?? 0;
    // totalAmount string olabilir, number'a çevir
    return typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;
  },
}));
