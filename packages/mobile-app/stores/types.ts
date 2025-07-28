//  "types.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import type { 
  User, 
  Address, 
  Order, 
  OrderDetail, 
  CartItem, 
  CartSummary,
  PaymentMethod 
} from '@metropolitan/shared';

// Auth slice state
export interface AuthSlice {
  user: User | null;
  token: string | null;
  registrationToken: string | null;
  isGuest: boolean;
  guestId: string | null;
  phoneNumber: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Cart slice state
export interface CartSlice {
  items: CartItem[];
  summary: CartSummary | null;
  loading: boolean;
  error: string | null;
  lastSynced: string | null;
  stockValidation: {
    hasInvalidItems: boolean;
    invalidItems: Array<CartItem & { availableStock: number }>;
    validatedAt: string;
  } | null;
}

// Checkout slice state
export interface CheckoutSlice {
  currentStep: number;
  totalSteps: number;
  deliveryAddress: Address | null;
  billingAddress: Address | null;
  billingAddressSameAsDelivery: boolean;
  selectedPaymentMethod: PaymentMethod | null;
  paymentMethods: PaymentMethod[];
  agreedToTerms: boolean;
  notes: string;
  processing: boolean;
  error: string | null;
}

// Order slice state
export interface OrderSlice {
  orders: Order[];
  selectedOrder: OrderDetail | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

// Inventory slice state
export interface InventorySlice {
  stockLevels: Record<string, number>;
  reservations: Record<string, StockReservation>;
  priceUpdates: Record<string, PriceUpdate>;
  connected: boolean;
}

// Offline action queue
export interface OfflineAction {
  id: string;
  type: 'ADD_TO_CART' | 'UPDATE_QUANTITY' | 'REMOVE_FROM_CART' | 'UPDATE_PROFILE';
  payload: any;
  queuedAt: string;
  retryCount: number;
}

// Supporting types
export interface StockReservation {
  userId: string;
  productId: string;
  quantity: number;
  reservedAt: string;
  expiresAt: string;
}

export interface PriceUpdate {
  productId: string;
  oldPrice: number;
  newPrice: number;
  updatedAt: string;
}

// Main store interface
export interface EcommerceStore extends 
  AuthSlice, 
  CartSlice, 
  CheckoutSlice, 
  OrderSlice, 
  InventorySlice 
{
  // Offline support
  offlineQueue: OfflineAction[];
  isOnline: boolean;
  
  // Auth actions
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; message: string; isNewUser: boolean }>;
  completeProfile: (userData: any) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (userData: any) => Promise<{ success: boolean; message: string }>;
  uploadProfilePhoto: (uri: string) => Promise<{ success: boolean; message: string }>;
  refreshUserProfile: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  
  // Cart actions
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  migrateGuestCart: (userId: string) => Promise<void>;
  syncCart: () => Promise<void>;
  
  // Checkout actions
  nextCheckoutStep: () => void;
  prevCheckoutStep: () => void;
  setDeliveryAddress: (address: Address) => void;
  setBillingAddress: (address: Address) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCheckoutNotes: (notes: string) => void;
  toggleTermsAgreement: () => void;
  processOrder: () => Promise<{ success: boolean; order?: Order; error?: string }>;
  resetCheckout: () => void;
  saveCheckoutProgress: () => Promise<void>;
  restoreCheckoutProgress: () => Promise<void>;
  
  // Order actions
  fetchOrders: (page?: number) => Promise<void>;
  fetchOrderDetail: (orderId: string) => Promise<void>;
  reorderItems: (orderId: string) => Promise<void>;
  
  // Inventory actions
  connectInventorySocket: () => WebSocket | null;
  validateCartStock: () => void;
  handlePriceUpdates: (productId: string) => void;
  
  // Offline actions
  queueOfflineAction: (action: Omit<OfflineAction, 'id' | 'queuedAt' | 'retryCount'>) => void;
  processOfflineQueue: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  
  // Utility actions
  clearAllErrors: () => void;
  resetStore: () => void;
}