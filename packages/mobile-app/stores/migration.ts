//  "migration.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { useEcommerceStore } from './index';
import { 
  useAuthState, 
  useCartState, 
  useCheckoutState,
  useOrderState 
} from './selectors';
import { 
  useAuthActions, 
  useCartActions, 
  useCheckoutActions,
  useOrderActions 
} from './actions';

// =============================================================================
// CONTEXT API COMPATIBILITY HOOKS
// =============================================================================

// Drop-in replacement for AuthContext
export const useAuth = () => {
  const state = useAuthState();
  const actions = useAuthActions();
  
  return {
    // State (compatible with existing AuthContext)
    user: state.user,
    token: state.token,
    registrationToken: useEcommerceStore(state => state.registrationToken),
    isGuest: state.isGuest,
    guestId: state.guestId,
    phoneNumber: state.phoneNumber,
    loading: state.loading,
    
    // Actions (compatible with existing AuthContext)
    sendOTP: actions.sendOTP,
    verifyOTP: actions.verifyOTP,
    completeProfile: actions.completeProfile,
    updateUserProfile: actions.updateUserProfile,
    uploadProfilePhoto: actions.uploadProfilePhoto,
    refreshUserProfile: actions.refreshUserProfile,
    loginAsGuest: actions.loginAsGuest,
    logout: actions.logout,
  };
};

// Drop-in replacement for CartContext
export const useCart = () => {
  const state = useCartState();
  const actions = useCartActions();
  
  return {
    // State (compatible with existing CartContext)
    cartItems: state.items,
    summary: state.summary,
    isLoading: state.loading,
    error: state.error,
    
    // Actions (compatible with existing CartContext)
    addToCart: actions.addToCart,
    updateQuantity: actions.updateQuantity,
    removeItem: actions.removeFromCart,
    clearCart: actions.clearCart,
    refreshCart: actions.refreshCart,
  };
};

// Drop-in replacement for CheckoutContext
export const useCheckout = () => {
  const state = useCheckoutState();
  const actions = useCheckoutActions();
  
  return {
    // State (compatible with existing CheckoutContext)
    state: {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      deliveryAddress: state.deliveryAddress,
      billingAddress: state.billingAddress,
      billingAddressSameAsDelivery: state.billingAddressSameAsDelivery,
      selectedPaymentMethod: state.selectedPaymentMethod,
      paymentMethods: state.paymentMethods,
      agreedToTerms: state.agreedToTerms,
      notes: state.notes,
    },
    
    // Actions (compatible with existing CheckoutContext)
    nextStep: actions.nextStep,
    prevStep: actions.prevStep,
    setDeliveryAddress: actions.setDeliveryAddress,
    setBillingAddress: actions.setBillingAddress,
    setPaymentMethod: actions.setPaymentMethod,
    setNotes: actions.setNotes,
    toggleTermsAgreement: actions.toggleTerms,
    processOrder: actions.processOrder,
    resetCheckout: actions.resetCheckout,
    
    // Additional properties for compatibility
    getAvailablePaymentMethods: () => state.paymentMethods,
  };
};

// Drop-in replacement for OrderContext (if it exists)
export const useOrders = () => {
  const state = useOrderState();
  const actions = useOrderActions();
  
  return {
    // State
    orders: state.orders,
    selectedOrder: state.selectedOrder,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    
    // Actions
    fetchOrders: actions.fetchOrders,
    fetchOrderDetail: actions.fetchOrderDetail,
    reorderItems: actions.reorderItems,
  };
};

// =============================================================================
// MIGRATION HELPERS
// =============================================================================

// Helper to migrate existing localStorage/AsyncStorage data
export const migrateStorageData = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    // Check for existing auth data
    const existingToken = await AsyncStorage.getItem('auth_token');
    const existingUser = await AsyncStorage.getItem('user_data');
    const existingGuestId = await AsyncStorage.getItem('guest_id');
    
    if (existingToken || existingUser || existingGuestId) {
      console.log('Migrating existing auth data to Zustand store...');
      
      const store = useEcommerceStore.getState();
      
      // Migrate auth data
      if (existingToken) {
        store.token = existingToken;
        store.isAuthenticated = true;
      }
      
      if (existingUser) {
        try {
          store.user = JSON.parse(existingUser);
        } catch (error) {
          console.warn('Failed to parse existing user data:', error);
        }
      }
      
      if (existingGuestId) {
        store.guestId = existingGuestId;
        store.isGuest = !existingToken; // Only guest if no token
      }
      
      // Clean up old storage keys
      await AsyncStorage.multiRemove([
        'auth_token',
        'user_data', 
        'guest_id',
        'cart_data',
        'checkout_progress',
      ]);
      
      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.warn('Failed to migrate existing storage data:', error);
  }
};

// Helper to validate migration
export const validateMigration = () => {
  const store = useEcommerceStore.getState();
  
  const checks = {
    storeInitialized: typeof store === 'object',
    authSlicePresent: 'user' in store && 'token' in store,
    cartSlicePresent: 'items' in store && 'summary' in store,
    checkoutSlicePresent: 'currentStep' in store && 'deliveryAddress' in store,
    actionsPresent: typeof store.addToCart === 'function',
    persistenceWorking: !!store.items && Array.isArray(store.items),
  };
  
  const allChecksPass = Object.values(checks).every(Boolean);
  
  if (allChecksPass) {
    console.log('✅ Zustand migration validation passed');
  } else {
    console.warn('❌ Zustand migration validation failed:', checks);
  }
  
  return { passed: allChecksPass, checks };
};

// =============================================================================
// PROVIDER COMPATIBILITY
// =============================================================================

// Temporary provider for gradual migration
export const ZustandCompatibilityProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize store on mount
  React.useEffect(() => {
    const store = useEcommerceStore.getState();
    
    // Initialize offline support
    const cleanupOffline = store.initializeOfflineSupport();
    
    // Connect inventory socket
    const inventorySocket = store.connectInventorySocket();
    
    // Restore checkout progress
    store.restoreCheckoutProgress();
    
    // Sync cart if user is authenticated
    if (store.isAuthenticated || store.guestId) {
      store.syncCart();
    }
    
    return () => {
      cleanupOffline?.();
      inventorySocket?.close();
    };
  }, []);
  
  return <>{children}</>;
};

// =============================================================================
// DEBUGGING HELPERS
// =============================================================================

// Debug hook to monitor store changes
export const useStoreDebug = () => {
  if (__DEV__) {
    const store = useEcommerceStore();
    
    React.useEffect(() => {
      console.log('Store state changed:', {
        auth: {
          isAuthenticated: store.isAuthenticated,
          isGuest: store.isGuest,
          user: store.user?.id,
        },
        cart: {
          itemCount: store.items.length,
          total: store.summary?.total,
        },
        checkout: {
          step: store.currentStep,
          hasAddress: !!store.deliveryAddress,
          hasPayment: !!store.selectedPaymentMethod,
        },
        offline: {
          isOnline: store.isOnline,
          queueLength: store.offlineQueue.length,
        },
      });
    });
  }
};

// Performance monitoring
export const usePerformanceMonitor = () => {
  if (__DEV__) {
    const renderCount = React.useRef(0);
    const lastRenderTime = React.useRef(Date.now());
    
    React.useEffect(() => {
      renderCount.current += 1;
      const now = Date.now();
      const timeSinceLastRender = now - lastRenderTime.current;
      lastRenderTime.current = now;
      
      if (renderCount.current % 10 === 0) {
        console.log(`Performance: ${renderCount.current} renders, avg ${timeSinceLastRender}ms between renders`);
      }
    });
    
    return {
      renderCount: renderCount.current,
      avgRenderTime: Date.now() - lastRenderTime.current,
    };
  }
  
  return { renderCount: 0, avgRenderTime: 0 };
};

// Export for global access in development
if (__DEV__) {
  (global as any).zustandStore = useEcommerceStore;
  (global as any).validateZustandMigration = validateMigration;
}