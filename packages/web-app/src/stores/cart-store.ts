import { create } from 'zustand';
import type { CartItem } from '@metropolitan/shared';

interface CartSummary {
  totalItems: number;
  subtotal: number;
  currency: string;
}

interface CartState {
  items: CartItem[];
  summary: CartSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCart: (items: CartItem[], summary: CartSummary) => void;
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
    return state.summary?.subtotal ?? 0;
  },
}));
