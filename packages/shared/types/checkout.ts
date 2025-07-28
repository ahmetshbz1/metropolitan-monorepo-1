//  "checkout.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.

import type { Address } from "./address";

// Modern ödeme yöntemleri
export enum PaymentType {
  CARD = "card",
  APPLE_PAY = "apple_pay",
  GOOGLE_PAY = "google_pay",
  BLIK = "blik",
  STRIPE = "stripe",
  BANK_TRANSFER = "bank_transfer",
}

export interface CheckoutPaymentMethod {
  id: string;
  type: PaymentType;
  title: string;
  subtitle?: string;
  icon: string; // Icon name as string instead of Expo-specific type
  isAvailable: boolean;
}

export interface CheckoutState {
  // Adım bilgileri
  currentStep: number;
  totalSteps: number;

  // Adres bilgileri
  deliveryAddress: Address | null;
  billingAddress: Address | null;
  billingAddressSameAsDelivery: boolean;

  // Ödeme bilgileri
  selectedPaymentMethod: CheckoutPaymentMethod | null;

  // Sipariş özeti
  agreedToTerms: boolean;

  // Yeni eklenen ödeme metodları
  paymentMethods: CheckoutPaymentMethod[];

  // Yeni eklenen notlar
  notes: string;
}

export type Action =
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_DELIVERY_ADDRESS"; payload: Address }
  | { type: "SET_BILLING_ADDRESS"; payload: Address | null }
  | { type: "SET_BILLING_ADDRESS_SAME_AS_DELIVERY"; payload: boolean }
  | { type: "SET_PAYMENT_METHOD"; payload: CheckoutPaymentMethod }
  | { type: "SET_AGREED_TO_TERMS"; payload: boolean }
  | { type: "SET_NOTES"; payload: string }
  | { type: "RESET_CHECKOUT_WITH_STATE"; payload: CheckoutState }
  | { type: "RESET_CHECKOUT" };

export interface CheckoutContextType {
  state: CheckoutState;

  // Adım kontrolü
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceedToNext: () => boolean;

  // Adres işlemleri
  setDeliveryAddress: (address: Address) => void;
  setBillingAddress: (address: Address | null) => void;
  setBillingAddressSameAsDelivery: (same: boolean) => void;

  // Ödeme işlemleri
  setPaymentMethod: (method: CheckoutPaymentMethod) => void;
  getAvailablePaymentMethods: () => CheckoutPaymentMethod[];

  // Sipariş işlemleri
  setAgreedToTerms: (agreed: boolean) => void;
  resetCheckout: () => void;

  // Not işlemleri
  setNotes: (notes: string) => void;
}
