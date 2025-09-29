import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@metropolitan/shared';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      
      setItems: (items) => set({ items }),
      
      addItem: (item) => set((state) => {
        const existingIndex = state.items.findIndex(i => i.productId === item.productId);
        if (existingIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingIndex].quantity += item.quantity;
          return { items: newItems };
        }
        return { items: [...state.items, item] };
      }),
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.productId !== productId)
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(i => 
          i.productId === productId ? { ...i, quantity } : i
        )
      })),
      
      clearCart: () => set({ items: [] }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'metropolitan-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
