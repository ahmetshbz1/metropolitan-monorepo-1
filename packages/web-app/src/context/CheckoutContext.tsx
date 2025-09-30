"use client";

import React, { createContext, useContext, useReducer, useMemo, useCallback, ReactNode } from "react";
import { useAuthStore } from "@/stores";
import type { Address } from "@metropolitan/shared";

// Checkout Steps
export type CheckoutStep = "cart" | "address" | "payment" | "summary";

// Payment Methods
export interface PaymentMethod {
  id: string;
  name: string;
  type: "card" | "bank_transfer" | "cash_on_delivery";
  icon: string;
  description?: string;
}

// Checkout State
export interface CheckoutState {
  currentStep: CheckoutStep;
  deliveryAddress: Address | null;
  billingAddress: Address | null;
  billingAddressSameAsDelivery: boolean;
  selectedPaymentMethod: PaymentMethod | null;
  agreedToTerms: boolean;
  notes: string;
  paymentMethods: PaymentMethod[];
}

// Actions
type CheckoutAction =
  | { type: "SET_STEP"; payload: CheckoutStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_DELIVERY_ADDRESS"; payload: Address | null }
  | { type: "SET_BILLING_ADDRESS"; payload: Address | null }
  | { type: "SET_BILLING_SAME_AS_DELIVERY"; payload: boolean }
  | { type: "SET_PAYMENT_METHOD"; payload: PaymentMethod | null }
  | { type: "SET_AGREED_TO_TERMS"; payload: boolean }
  | { type: "SET_NOTES"; payload: string }
  | { type: "RESET_CHECKOUT" };

// Context Type
interface CheckoutContextType {
  state: CheckoutState;
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDeliveryAddress: (address: Address | null) => void;
  setBillingAddress: (address: Address | null) => void;
  setBillingAddressSameAsDelivery: (same: boolean) => void;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setAgreedToTerms: (agreed: boolean) => void;
  setNotes: (notes: string) => void;
  resetCheckout: () => void;
  canProceedToNext: () => boolean;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// Available payment methods
const getAvailablePaymentMethods = (): PaymentMethod[] => [
  {
    id: "card",
    name: "Kredi/Banka Kartı",
    type: "card",
    icon: "solar:card-line-duotone",
    description: "Stripe ile güvenli ödeme",
  },
  {
    id: "bank_transfer",
    name: "Banka Havalesi",
    type: "bank_transfer",
    icon: "solar:bank-line-duotone",
    description: "Havale/EFT ile ödeme",
  },
  {
    id: "cash_on_delivery",
    name: "Kapıda Ödeme",
    type: "cash_on_delivery",
    icon: "solar:wallet-line-duotone",
    description: "Teslimat sırasında nakit/kart",
  },
];

// Step order
const STEP_ORDER: CheckoutStep[] = ["cart", "address", "payment", "summary"];

// Reducer
function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };

    case "NEXT_STEP": {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1);
      return { ...state, currentStep: STEP_ORDER[nextIndex] };
    }

    case "PREV_STEP": {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { ...state, currentStep: STEP_ORDER[prevIndex] };
    }

    case "SET_DELIVERY_ADDRESS":
      return {
        ...state,
        deliveryAddress: action.payload,
        // Eğer billing same as delivery ise, billing'i de güncelle
        billingAddress: state.billingAddressSameAsDelivery ? action.payload : state.billingAddress,
      };

    case "SET_BILLING_ADDRESS":
      return { ...state, billingAddress: action.payload };

    case "SET_BILLING_SAME_AS_DELIVERY":
      return {
        ...state,
        billingAddressSameAsDelivery: action.payload,
        // Eğer true ise, billing'i delivery ile senkronize et
        billingAddress: action.payload ? state.deliveryAddress : state.billingAddress,
      };

    case "SET_PAYMENT_METHOD":
      return { ...state, selectedPaymentMethod: action.payload };

    case "SET_AGREED_TO_TERMS":
      return { ...state, agreedToTerms: action.payload };

    case "SET_NOTES":
      return { ...state, notes: action.payload };

    case "RESET_CHECKOUT":
      return {
        currentStep: "cart",
        deliveryAddress: null,
        billingAddress: null,
        billingAddressSameAsDelivery: true,
        selectedPaymentMethod: null,
        agreedToTerms: false,
        notes: "",
        paymentMethods: getAvailablePaymentMethods(),
      };

    default:
      return state;
  }
}

// Provider
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const initialState: CheckoutState = useMemo(
    () => ({
      currentStep: "cart",
      deliveryAddress: null,
      billingAddress: null,
      billingAddressSameAsDelivery: true,
      selectedPaymentMethod: null,
      agreedToTerms: false,
      notes: "",
      paymentMethods: getAvailablePaymentMethods(),
    }),
    []
  );

  const [state, dispatch] = useReducer(checkoutReducer, initialState);

  const setStep = useCallback((step: CheckoutStep) => {
    dispatch({ type: "SET_STEP", payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  const setDeliveryAddress = useCallback((address: Address | null) => {
    dispatch({ type: "SET_DELIVERY_ADDRESS", payload: address });
  }, []);

  const setBillingAddress = useCallback((address: Address | null) => {
    dispatch({ type: "SET_BILLING_ADDRESS", payload: address });
  }, []);

  const setBillingAddressSameAsDelivery = useCallback((same: boolean) => {
    dispatch({ type: "SET_BILLING_SAME_AS_DELIVERY", payload: same });
  }, []);

  const setPaymentMethod = useCallback((method: PaymentMethod | null) => {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method });
  }, []);

  const setAgreedToTerms = useCallback((agreed: boolean) => {
    dispatch({ type: "SET_AGREED_TO_TERMS", payload: agreed });
  }, []);

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: "SET_NOTES", payload: notes });
  }, []);

  const resetCheckout = useCallback(() => {
    dispatch({ type: "RESET_CHECKOUT" });
  }, []);

  // Validation: Can proceed to next step?
  const canProceedToNext = useCallback(() => {
    switch (state.currentStep) {
      case "cart":
        return true; // Sepette ürün varsa devam edilebilir (CartDrawer'da kontrol edilecek)
      case "address":
        return state.deliveryAddress !== null;
      case "payment":
        return state.selectedPaymentMethod !== null;
      case "summary":
        return state.agreedToTerms;
      default:
        return false;
    }
  }, [state]);

  const value = useMemo<CheckoutContextType>(
    () => ({
      state,
      setStep,
      nextStep,
      prevStep,
      setDeliveryAddress,
      setBillingAddress,
      setBillingAddressSameAsDelivery,
      setPaymentMethod,
      setAgreedToTerms,
      setNotes,
      resetCheckout,
      canProceedToNext,
    }),
    [
      state,
      setStep,
      nextStep,
      prevStep,
      setDeliveryAddress,
      setBillingAddress,
      setBillingAddressSameAsDelivery,
      setPaymentMethod,
      setAgreedToTerms,
      setNotes,
      resetCheckout,
      canProceedToNext,
    ]
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

// Hook
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}