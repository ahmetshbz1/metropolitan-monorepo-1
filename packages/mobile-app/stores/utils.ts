//  "utils.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { CartItem, CartSummary } from '@metropolitan/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate unique IDs for optimistic updates
export const generateTempId = (): string => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Calculate optimistic cart summary
export const calculateOptimisticSummary = (items: CartItem[]): CartSummary => {
  const subtotal = items.reduce((sum, item) => {
    if (item.product?.price) {
      return sum + (item.product.price * item.quantity);
    }
    return sum;
  }, 0);

  const shippingCost = subtotal > 500 ? 0 : 29.90; // Free shipping over 500 TRY
  const taxRate = 0.18; // 18% KDV
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  return {
    subtotal,
    shippingCost,
    tax,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    discountAmount: 0, // TODO: Add discount calculation
  };
};

// Merge cart state for background sync
export const mergeCartState = (localItems: CartItem[], serverItems: CartItem[]): CartItem[] => {
  const optimisticItems = localItems.filter(item => item.isOptimistic);
  const serverItemIds = new Set(serverItems.map(item => item.id));
  
  // Keep optimistic items that haven't been processed by server yet
  const validOptimisticItems = optimisticItems.filter(item => 
    !serverItemIds.has(item.id.replace('temp-', ''))
  );
  
  return [...serverItems, ...validOptimisticItems];
};

// Validate checkout step
export const validateCheckoutStep = (checkout: any, step: number): boolean => {
  switch (step) {
    case 1: // Address step
      return checkout.deliveryAddress !== null;
    case 2: // Payment step
      return checkout.selectedPaymentMethod !== null;
    case 3: // Summary step
      return checkout.agreedToTerms;
    default:
      return false;
  }
};

// Storage utilities
export const StorageKeys = {
  CHECKOUT_PROGRESS: 'checkout_progress',
  CART_BACKUP: 'cart_backup',
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC: 'last_sync',
} as const;

export const storeData = async (key: string, data: any): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonData);
  } catch (error) {
    console.warn(`Failed to store data for key ${key}:`, error);
  }
};

export const retrieveData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonData = await AsyncStorage.getItem(key);
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.warn(`Failed to retrieve data for key ${key}:`, error);
    return null;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove data for key ${key}:`, error);
  }
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
};

// Network utilities
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('internet') ||
    !navigator.onLine
  );
};

// Retry utilities
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Date utilities
export const isExpired = (timestamp: string, maxAgeMs: number): boolean => {
  const now = new Date().getTime();
  const timestampMs = new Date(timestamp).getTime();
  return (now - timestampMs) > maxAgeMs;
};

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};