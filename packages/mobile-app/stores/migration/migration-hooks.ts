//  "migration-hooks.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.
//
//  Migration hooks that provide backward compatibility with existing Context API
//  while using Zustand stores internally. This allows gradual migration component by component.

import { useAuth as useZustandAuth } from '../auth/hooks';
import { useCart as useZustandCart } from '../cart/hooks';

// Auth migration hook - drop-in replacement for existing useAuth
export const useAuth = () => {
  const zustandAuth = useZustandAuth();
  
  // Map Zustand auth to existing Context API structure
  return {
    // Existing properties
    user: zustandAuth.user,
    token: zustandAuth.token,
    registrationToken: zustandAuth.registrationToken,
    isGuest: zustandAuth.isGuest,
    guestId: zustandAuth.guestId,
    phoneNumber: zustandAuth.phoneNumber,
    loading: zustandAuth.loading,
    
    // Existing methods
    sendOTP: zustandAuth.sendOTP,
    verifyOTP: zustandAuth.verifyOTP,
    completeProfile: zustandAuth.completeProfile,
    updateUserProfile: zustandAuth.updateUserProfile,
    uploadProfilePhoto: zustandAuth.uploadProfilePhoto,
    refreshUserProfile: zustandAuth.refreshUserProfile,
    loginAsGuest: zustandAuth.loginAsGuest,
    logout: zustandAuth.logout,
    
    // Additional computed properties for backward compatibility
    isAuthenticated: zustandAuth.isAuthenticated,
    hasValidSession: zustandAuth.hasValidSession,
  };
};

// Cart migration hook - drop-in replacement for existing useCart
export const useCart = () => {
  const zustandCart = useZustandCart();
  
  // Map Zustand cart to existing Context API structure
  return {
    // Existing properties
    cartItems: zustandCart.cartItems,
    summary: zustandCart.summary,
    isLoading: zustandCart.isLoading,
    error: zustandCart.error,
    
    // Existing methods
    addToCart: zustandCart.addToCart,
    updateQuantity: zustandCart.updateQuantity,
    removeItem: zustandCart.removeItem,
    clearCart: zustandCart.clearCart,
    refreshCart: zustandCart.refreshCart,
    
    // Additional Zustand features (new capabilities)
    syncWithBackend: zustandCart.syncWithBackend,
    hasUnsyncedChanges: zustandCart.hasUnsyncedChanges,
  };
};

// Re-export types for backward compatibility
export type { CartItem, CartSummary } from '@metropolitan/shared';

// Create compatibility layer for Context components that might still be used
export const createMigrationProvider = <T>(
  useZustandHook: () => T,
  contextName: string
) => {
  return ({ children }: { children: React.ReactNode }) => {
    // This provider doesn't actually provide context
    // Instead, components using the migration hooks will get Zustand data
    console.log(`[Migration] ${contextName} provider is now using Zustand internally`);
    return <>{children}</>;
  };
};

// Backward compatibility providers (no-op providers for gradual migration)
export const MigrationAuthProvider = createMigrationProvider(useZustandAuth, 'Auth');
export const MigrationCartProvider = createMigrationProvider(useZustandCart, 'Cart');

// Hook factory for creating migration hooks for other contexts
export const createMigrationHook = <TOriginal, TZustand>(
  useZustandHook: () => TZustand,
  mapper: (zustandData: TZustand) => TOriginal
) => {
  return (): TOriginal => {
    const zustandData = useZustandHook();
    return mapper(zustandData);
  };
};

// Performance comparison hook for monitoring migration impact
export const useMigrationPerformance = () => {
  const authPerf = useZustandAuth();
  const cartPerf = useZustandCart();
  
  return {
    auth: {
      isLoading: authPerf.loading,
      hasUser: !!authPerf.user,
    },
    cart: {
      isLoading: cartPerf.isLoading,
      itemCount: cartPerf.cartItems.length,
      hasUnsyncedChanges: cartPerf.hasUnsyncedChanges,
    },
    migration: {
      status: 'in-progress',
      completedStores: ['auth', 'cart'],
      pendingStores: ['product', 'address', 'payment', 'favorites', 'order'],
    },
  };
};