# Zustand E-commerce Store Architecture

## 1. Core Store with Slices Pattern

```typescript
// /stores/ecommerceStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devtools } from 'zustand/middleware';

interface EcommerceStore {
  // Cart slice
  cart: {
    items: CartItem[];
    summary: CartSummary | null;
    loading: boolean;
    error: string | null;
    lastSynced: string | null;
  };
  
  // Auth slice
  auth: {
    user: User | null;
    isGuest: boolean;
    guestId: string | null;
    token: string | null;
    isAuthenticated: boolean;
  };
  
  // Checkout slice
  checkout: {
    currentStep: number;
    deliveryAddress: Address | null;
    billingAddress: Address | null;
    paymentMethod: PaymentMethod | null;
    agreedToTerms: boolean;
    notes: string;
    processing: boolean;
  };
  
  // Order slice
  order: {
    orders: Order[];
    selectedOrder: OrderDetail | null;
    loading: boolean;
    error: string | null;
    hasMore: boolean;
  };
  
  // Inventory slice (real-time)
  inventory: {
    stockLevels: Record<string, number>;
    reservations: Record<string, StockReservation>;
    priceUpdates: Record<string, PriceUpdate>;
  };
}
```

## 2. Shopping Cart Implementation with Persistence

```typescript
// /stores/slices/cartSlice.ts
export const createCartSlice = (set, get) => ({
  cart: {
    items: [],
    summary: null,
    loading: false,
    error: null,
    lastSynced: null,
  },
  
  // Optimistic cart operations
  addToCart: async (productId: string, quantity: number = 1) => {
    const tempId = `temp-${Date.now()}`;
    
    // Immediate UI feedback
    set((state) => {
      state.cart.items.push({
        id: tempId,
        productId,
        quantity,
        isOptimistic: true,
        product: get().products[productId] // From product cache
      });
    });
    
    try {
      const result = await CartService.addItem(productId, quantity);
      
      // Replace optimistic item with server response
      set((state) => {
        const index = state.cart.items.findIndex(item => item.id === tempId);
        if (index !== -1) {
          state.cart.items[index] = result.item;
        }
        state.cart.summary = result.summary;
        state.cart.lastSynced = new Date().toISOString();
        state.cart.error = null;
      });
    } catch (error) {
      // Rollback optimistic update
      set((state) => {
        state.cart.items = state.cart.items.filter(item => item.id !== tempId);
        state.cart.error = error.message;
      });
      
      // Queue for retry when back online
      if (!navigator.onLine) {
        get().queueOfflineAction({
          type: 'ADD_TO_CART',
          payload: { productId, quantity },
          id: tempId
        });
      }
    }
  },
  
  updateQuantity: async (itemId: string, quantity: number) => {
    const previousItems = [...get().cart.items];
    
    // Optimistic update
    set((state) => {
      const item = state.cart.items.find(i => i.id === itemId);
      if (item) {
        item.quantity = quantity;
        // Recalculate summary optimistically
        state.cart.summary = calculateOptimisticSummary(state.cart.items);
      }
    });
    
    try {
      const result = await CartService.updateQuantity(itemId, quantity);
      set((state) => {
        state.cart.items = result.items;
        state.cart.summary = result.summary;
        state.cart.lastSynced = new Date().toISOString();
      });
    } catch (error) {
      // Rollback
      set((state) => {
        state.cart.items = previousItems;
        state.cart.error = error.message;
      });
    }
  },
  
  // Guest to user cart migration
  migrateGuestCart: async (userId: string) => {
    const guestItems = get().cart.items;
    if (guestItems.length === 0) return;
    
    try {
      set((state) => { state.cart.loading = true; });
      
      const result = await CartService.migrateGuestCart(
        get().auth.guestId, 
        userId
      );
      
      set((state) => {
        state.cart.items = result.items;
        state.cart.summary = result.summary;
        state.cart.loading = false;
        state.cart.lastSynced = new Date().toISOString();
      });
    } catch (error) {
      set((state) => {
        state.cart.loading = false;
        state.cart.error = error.message;
      });
    }
  },
  
  // Background sync for cart state
  syncCart: async () => {
    if (!get().auth.isAuthenticated && !get().auth.guestId) return;
    
    try {
      const result = await CartService.getCart(
        get().auth.isAuthenticated,
        get().auth.guestId
      );
      
      set((state) => {
        // Merge server state with any pending optimistic updates
        state.cart.items = mergeCartState(state.cart.items, result.items);
        state.cart.summary = result.summary;
        state.cart.lastSynced = new Date().toISOString();
        state.cart.error = null;
      });
    } catch (error) {
      console.warn('Background cart sync failed:', error);
    }
  },
});
```

## 3. Multi-step Checkout Implementation

```typescript
// /stores/slices/checkoutSlice.ts
export const createCheckoutSlice = (set, get) => ({
  checkout: {
    currentStep: 1,
    totalSteps: 3,
    deliveryAddress: null,
    billingAddress: null,
    billingAddressSameAsDelivery: true,
    paymentMethod: null,
    agreedToTerms: false,
    notes: '',
    processing: false,
  },
  
  // Step navigation with validation
  nextCheckoutStep: () => {
    const { checkout } = get();
    const isValid = validateCheckoutStep(checkout, checkout.currentStep);
    
    if (isValid && checkout.currentStep < checkout.totalSteps) {
      set((state) => {
        state.checkout.currentStep += 1;
      });
      
      // Auto-save progress
      get().saveCheckoutProgress();
    }
  },
  
  prevCheckoutStep: () => {
    set((state) => {
      if (state.checkout.currentStep > 1) {
        state.checkout.currentStep -= 1;
      }
    });
  },
  
  setDeliveryAddress: (address: Address) => {
    set((state) => {
      state.checkout.deliveryAddress = address;
      
      // Auto-set billing address if same as delivery
      if (state.checkout.billingAddressSameAsDelivery) {
        state.checkout.billingAddress = address;
      }
    });
    
    get().saveCheckoutProgress();
  },
  
  setPaymentMethod: (method: PaymentMethod) => {
    set((state) => {
      state.checkout.paymentMethod = method;
    });
    
    get().saveCheckoutProgress();
  },
  
  // Process order with Stripe integration
  processOrder: async () => {
    const { checkout, cart, auth } = get();
    
    set((state) => { state.checkout.processing = true; });
    
    try {
      // 1. Create order
      const orderData = {
        shippingAddressId: checkout.deliveryAddress?.id,
        billingAddressId: checkout.billingAddress?.id,
        paymentMethodId: checkout.paymentMethod?.id,
        notes: checkout.notes,
      };
      
      const result = await OrderService.createOrder(orderData);
      
      // 2. Process payment with Stripe
      if (checkout.paymentMethod?.type === 'stripe_card') {
        const paymentResult = await StripeService.confirmPayment(
          result.paymentIntentId,
          checkout.paymentMethod
        );
        
        if (paymentResult.error) {
          throw new Error(paymentResult.error.message);
        }
      }
      
      // 3. Clear cart and reset checkout
      set((state) => {
        state.cart.items = [];
        state.cart.summary = null;
        state.checkout = {
          ...initialCheckoutState,
          processing: false,
        };
        // Add order to order history
        state.order.orders.unshift(result.order);
      });
      
      return { success: true, order: result.order };
      
    } catch (error) {
      set((state) => {
        state.checkout.processing = false;
        state.checkout.error = error.message;
      });
      
      return { success: false, error: error.message };
    }
  },
  
  // Persist checkout progress for abandoned cart recovery
  saveCheckoutProgress: async () => {
    const { checkout } = get();
    try {
      await AsyncStorage.setItem(
        'checkout_progress',
        JSON.stringify({
          ...checkout,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.warn('Failed to save checkout progress:', error);
    }
  },
  
  // Restore checkout progress
  restoreCheckoutProgress: async () => {
    try {
      const saved = await AsyncStorage.getItem('checkout_progress');
      if (saved) {
        const progress = JSON.parse(saved);
        const savedAt = new Date(progress.savedAt);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
        
        // Only restore if less than 24 hours old
        if (hoursSinceUpdate < 24) {
          set((state) => {
            state.checkout = { ...progress, processing: false };
          });
        }
      }
    } catch (error) {
      console.warn('Failed to restore checkout progress:', error);
    }
  },
});
```

## 4. Real-time Inventory Management

```typescript
// /stores/slices/inventorySlice.ts
export const createInventorySlice = (set, get) => ({
  inventory: {
    stockLevels: {},
    reservations: {},
    priceUpdates: {},
  },
  
  // WebSocket connection for real-time updates
  connectInventorySocket: () => {
    const ws = new WebSocket(process.env.EXPO_PUBLIC_WS_URL);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'STOCK_UPDATE':
          set((state) => {
            state.inventory.stockLevels[data.productId] = data.newStock;
          });
          
          // Update cart items if stock changed
          get().validateCartStock();
          break;
          
        case 'PRICE_UPDATE':
          set((state) => {
            state.inventory.priceUpdates[data.productId] = {
              oldPrice: data.oldPrice,
              newPrice: data.newPrice,
              updatedAt: data.timestamp,
            };
          });
          
          // Notify user of price changes in cart
          get().handlePriceUpdates(data.productId);
          break;
          
        case 'RESERVATION_CONFIRMED':
          set((state) => {
            delete state.inventory.reservations[`${data.userId}:${data.productId}`];
          });
          break;
      }
    };
    
    return ws;
  },
  
  // Validate cart items against current stock
  validateCartStock: () => {
    const { cart, inventory } = get();
    const invalidItems = [];
    
    cart.items.forEach(item => {
      const currentStock = inventory.stockLevels[item.product.id];
      if (currentStock !== undefined && currentStock < item.quantity) {
        invalidItems.push({
          ...item,
          availableStock: currentStock,
        });
      }
    });
    
    if (invalidItems.length > 0) {
      set((state) => {
        state.cart.stockValidation = {
          hasInvalidItems: true,
          invalidItems,
          validatedAt: new Date().toISOString(),
        };
      });
    }
  },
  
  // Handle price updates in cart
  handlePriceUpdates: (productId: string) => {
    const { cart } = get();
    const cartItem = cart.items.find(item => item.product.id === productId);
    
    if (cartItem) {
      // Show price change notification
      set((state) => {
        state.notifications.push({
          id: `price-update-${productId}`,
          type: 'PRICE_CHANGE',
          message: 'Bir ürününün fiyatı değişti',
          productId,
          timestamp: new Date().toISOString(),
        });
      });
    }
  },
});
```

## 5. Store Configuration with Middleware

```typescript
// /stores/ecommerceStore.ts
export const useEcommerceStore = create<EcommerceStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...createCartSlice(set, get),
        ...createAuthSlice(set, get),
        ...createCheckoutSlice(set, get),
        ...createOrderSlice(set, get),
        ...createInventorySlice(set, get),
        
        // Offline action queue
        offlineQueue: [],
        queueOfflineAction: (action) => {
          set((state) => {
            state.offlineQueue.push({
              ...action,
              queuedAt: new Date().toISOString(),
            });
          });
        },
        
        processOfflineQueue: async () => {
          const { offlineQueue } = get();
          
          for (const action of offlineQueue) {
            try {
              switch (action.type) {
                case 'ADD_TO_CART':
                  await get().addToCart(action.payload.productId, action.payload.quantity);
                  break;
                case 'UPDATE_QUANTITY':
                  await get().updateQuantity(action.payload.itemId, action.payload.quantity);
                  break;
                case 'REMOVE_FROM_CART':
                  await get().removeFromCart(action.payload.itemId);
                  break;
              }
              
              // Remove processed action
              set((state) => {
                state.offlineQueue = state.offlineQueue.filter(a => a.id !== action.id);
              });
              
            } catch (error) {
              console.warn('Failed to process offline action:', action, error);
            }
          }
        },
      })),
      {
        name: 'metropolitan-store',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          // Only persist necessary data
          cart: {
            items: state.cart.items,
            summary: state.cart.summary,
            lastSynced: state.cart.lastSynced,
          },
          auth: {
            user: state.auth.user,
            isGuest: state.auth.isGuest,
            guestId: state.auth.guestId,
            token: state.auth.token,
          },
          checkout: state.checkout,
          offlineQueue: state.offlineQueue,
        }),
        version: 1,
        migrate: (persistedState, version) => {
          // Handle schema migrations
          if (version === 0) {
            // Migration logic for v0 to v1
          }
          return persistedState as EcommerceStore;
        },
      }
    ),
    {
      name: 'metropolitan-store',
      enabled: __DEV__,
    }
  )
);

// Typed selectors for better performance
export const useCartItems = () => useEcommerceStore(state => state.cart.items);
export const useCartSummary = () => useEcommerceStore(state => state.cart.summary);
export const useCartLoading = () => useEcommerceStore(state => state.cart.loading);
export const useCheckoutStep = () => useEcommerceStore(state => state.checkout.currentStep);
export const useIsAuthenticated = () => useEcommerceStore(state => state.auth.isAuthenticated);

// Actions
export const useCartActions = () => useEcommerceStore(
  state => ({
    addToCart: state.addToCart,
    updateQuantity: state.updateQuantity,
    removeFromCart: state.removeFromCart,
    clearCart: state.clearCart,
  })
);
```

## Usage in Components

```typescript
// /components/cart/CartItem.tsx
import { useCartActions, useCartItems } from '@/stores/ecommerceStore';

export function CartItem({ itemId }: { itemId: string }) {
  // Selective subscription - only re-renders when this specific item changes
  const item = useEcommerceStore(state => 
    state.cart.items.find(i => i.id === itemId)
  );
  const { updateQuantity, removeFromCart } = useCartActions();
  
  const handleQuantityChange = (newQuantity: number) => {
    // Optimistic update with automatic rollback on failure
    updateQuantity(itemId, newQuantity);
  };
  
  return (
    <View className="cart-item">
      <Text>{item?.product.name}</Text>
      <QuantitySelector
        value={item?.quantity || 0}
        onChange={handleQuantityChange}
        max={item?.product.stock || 0}
      />
      {item?.isOptimistic && (
        <ActivityIndicator size="small" />
      )}
    </View>
  );
}
```