//  "checkoutSlice.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { StateCreator } from 'zustand';
import { EcommerceStore, CheckoutSlice } from '../types';
import { 
  handleApiError, 
  validateCheckoutStep,
  storeData,
  retrieveData,
  StorageKeys,
  isExpired
} from '../utils';
import api from '@/core/api';
import { Address, PaymentMethod, Order } from '@metropolitan/shared';

export const createCheckoutSlice: StateCreator<
  EcommerceStore,
  [],
  [],
  CheckoutSlice & {
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
  }
> = (set, get) => ({
  // Checkout state
  currentStep: 1,
  totalSteps: 3,
  deliveryAddress: null,
  billingAddress: null,
  billingAddressSameAsDelivery: true,
  selectedPaymentMethod: null,
  paymentMethods: [],
  agreedToTerms: false,
  notes: '',
  processing: false,
  error: null,

  // Step navigation with validation
  nextCheckoutStep: () => {
    const state = get();
    const isValid = validateCheckoutStep(state, state.currentStep);
    
    if (isValid && state.currentStep < state.totalSteps) {
      set({ currentStep: state.currentStep + 1 });
      
      // Auto-save progress
      get().saveCheckoutProgress();
    } else if (!isValid) {
      set({ error: 'Lütfen gerekli alanları doldurun.' });
    }
  },

  prevCheckoutStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ 
        currentStep: currentStep - 1,
        error: null 
      });
    }
  },

  // Set delivery address
  setDeliveryAddress: (address: Address) => {
    const { billingAddressSameAsDelivery } = get();
    
    set({
      deliveryAddress: address,
      billingAddress: billingAddressSameAsDelivery ? address : get().billingAddress,
      error: null,
    });
    
    get().saveCheckoutProgress();
  },

  // Set billing address
  setBillingAddress: (address: Address) => {
    set({
      billingAddress: address,
      billingAddressSameAsDelivery: false,
      error: null,
    });
    
    get().saveCheckoutProgress();
  },

  // Set payment method
  setPaymentMethod: (method: PaymentMethod) => {
    set({
      selectedPaymentMethod: method,
      error: null,
    });
    
    get().saveCheckoutProgress();
  },

  // Set checkout notes
  setCheckoutNotes: (notes: string) => {
    set({ notes });
    get().saveCheckoutProgress();
  },

  // Toggle terms agreement
  toggleTermsAgreement: () => {
    set({ 
      agreedToTerms: !get().agreedToTerms,
      error: null 
    });
  },

  // Process order with Stripe integration
  processOrder: async () => {
    const { 
      deliveryAddress, 
      billingAddress, 
      selectedPaymentMethod, 
      notes,
      agreedToTerms,
      items,
      summary,
      isAuthenticated,
      guestId,
      token 
    } = get();

    // Validation
    if (!deliveryAddress || !selectedPaymentMethod || !agreedToTerms) {
      set({ error: 'Lütfen gerekli alanları doldurun.' });
      return { success: false, error: 'Gerekli alanlar eksik' };
    }

    if (!items || items.length === 0) {
      set({ error: 'Sepetinizde ürün bulunmuyor.' });
      return { success: false, error: 'Sepet boş' };
    }

    set({ processing: true, error: null });

    try {
      // 1. Create order
      const orderData = {
        shippingAddressId: deliveryAddress.id,
        billingAddressId: billingAddress?.id || deliveryAddress.id,
        paymentMethodId: selectedPaymentMethod.id,
        notes: notes.trim(),
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product?.price,
        })),
        summary,
      };

      const endpoint = isAuthenticated ? '/orders/create' : '/orders/create-guest';
      const payload = isAuthenticated ? orderData : { ...orderData, guestId };
      const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};

      const orderResponse = await api.post(endpoint, payload, { headers });
      const { order, paymentIntentId } = orderResponse.data;

      // 2. Process payment with Stripe (if card payment)
      if (selectedPaymentMethod.type === 'stripe_card') {
        const paymentResponse = await api.post('/payments/confirm-payment', {
          paymentIntentId,
          paymentMethodId: selectedPaymentMethod.id,
        }, { headers });

        if (paymentResponse.data.error) {
          throw new Error(paymentResponse.data.error.message);
        }
      }

      // 3. Clear cart and reset checkout on success
      set({
        processing: false,
        currentStep: 1,
        deliveryAddress: null,
        billingAddress: null,
        selectedPaymentMethod: null,
        agreedToTerms: false,
        notes: '',
        error: null,
      });

      // Clear cart
      get().clearCart();

      // Add order to order history
      const currentOrders = get().orders || [];
      set({ orders: [order, ...currentOrders] });

      // Clear stored checkout progress
      await storeData(StorageKeys.CHECKOUT_PROGRESS, null);

      return { success: true, order };

    } catch (error) {
      const errorMessage = handleApiError(error);
      set({
        processing: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Reset checkout state
  resetCheckout: () => {
    set({
      currentStep: 1,
      deliveryAddress: null,
      billingAddress: null,
      billingAddressSameAsDelivery: true,
      selectedPaymentMethod: null,
      agreedToTerms: false,
      notes: '',
      processing: false,
      error: null,
    });
  },

  // Persist checkout progress for abandoned cart recovery
  saveCheckoutProgress: async () => {
    const {
      currentStep,
      deliveryAddress,
      billingAddress,
      billingAddressSameAsDelivery,
      selectedPaymentMethod,
      notes,
      agreedToTerms,
    } = get();

    try {
      await storeData(StorageKeys.CHECKOUT_PROGRESS, {
        currentStep,
        deliveryAddress,
        billingAddress,
        billingAddressSameAsDelivery,
        selectedPaymentMethod,
        notes,
        agreedToTerms,
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to save checkout progress:', error);
    }
  },

  // Restore checkout progress
  restoreCheckoutProgress: async () => {
    try {
      const saved = await retrieveData(StorageKeys.CHECKOUT_PROGRESS);
      
      if (saved && saved.savedAt) {
        // Only restore if less than 24 hours old
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
        
        if (!isExpired(saved.savedAt, maxAge)) {
          set({
            currentStep: saved.currentStep || 1,
            deliveryAddress: saved.deliveryAddress,
            billingAddress: saved.billingAddress,
            billingAddressSameAsDelivery: saved.billingAddressSameAsDelivery ?? true,
            selectedPaymentMethod: saved.selectedPaymentMethod,
            notes: saved.notes || '',
            agreedToTerms: saved.agreedToTerms || false,
            processing: false,
            error: null,
          });
        }
      }
    } catch (error) {
      console.warn('Failed to restore checkout progress:', error);
    }
  },
});