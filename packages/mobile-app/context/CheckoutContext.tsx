//  "CheckoutContext.tsx"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.
//  Last Modified by Ahmet on 15.07.2025.

import { useAddresses } from "@/context/AddressContext";
import { useAuth } from "@/context/AuthContext";
import { checkoutReducer } from "@/context/checkout/reducer";
import { Address } from "@metropolitan/shared/types/address";
import {
  Action,
  CheckoutContextType,
  CheckoutPaymentMethod,
  CheckoutState,
  PaymentType,
} from "@metropolitan/shared/types/checkout";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

// 1. Context'i oluştur
const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
);

// 2. Provider'ı oluştur
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addresses } = useAddresses();
  const { t } = useTranslation();

  const initialState: CheckoutState = useMemo(
    () => ({
      currentStep: 1,
      totalSteps: 3,
      deliveryAddress: null,
      billingAddress: null,
      billingAddressSameAsDelivery: true,
      selectedPaymentMethod: null,
      agreedToTerms: false,
      notes: "",
      paymentMethods: [], // Bu getAvailablePaymentMethods tarafından doldurulacak
    }),
    [t]
  );

  const getAvailablePaymentMethods =
    useCallback((): CheckoutPaymentMethod[] => {
      const methods: CheckoutPaymentMethod[] = [
        // Her zaman mevcut olan kart ödemesi
        {
          id: "card",
          type: PaymentType.STRIPE,
          title: t("checkout.payment_methods.card.title"),
          subtitle: t("checkout.payment_methods.card.subtitle"),
          icon: "card-outline",
          isAvailable: true,
        },
        // BLIK - sadece Polonya için
        {
          id: "blik",
          type: PaymentType.BLIK,
          title: "BLIK",
          subtitle: t("checkout.payment_methods.blik.subtitle"),
          icon: "phone-portrait-outline",
          isAvailable: true,
        },
        // Apple Pay - iOS cihazlarda
        {
          id: "apple_pay",
          type: PaymentType.APPLE_PAY,
          title: "Apple Pay",
          subtitle: t("checkout.payment_methods.apple_pay.subtitle"),
          icon: "logo-apple",
          isAvailable: Platform.OS === "ios",
        },
        // Google Pay - Android cihazlarda
        {
          id: "google_pay",
          type: PaymentType.GOOGLE_PAY,
          title: "Google Pay",
          subtitle: t("checkout.payment_methods.google_pay.subtitle"),
          icon: "logo-google",
          isAvailable: Platform.OS === "android",
        },
        // Banka havalesi - sadece kurumsal müşteriler için
        {
          id: "bank_transfer",
          type: PaymentType.BANK_TRANSFER,
          title: t("checkout.payment_methods.bank_transfer.title"),
          subtitle: t("checkout.payment_methods.bank_transfer.subtitle"),
          icon: "cash-outline",
          isAvailable: user?.userType === "corporate",
        },
      ];

      return methods.filter((method) => method.isAvailable);
    }, [t, user?.userType]);

  const [state, dispatch] = useReducer(
    (state: CheckoutState, action: Action) =>
      checkoutReducer(state, action, initialState),
    initialState
  );

  useEffect(() => {
    const updatedState = {
      ...initialState,
      paymentMethods: getAvailablePaymentMethods(),
    };
    dispatch({ type: "RESET_CHECKOUT_WITH_STATE", payload: updatedState });
  }, [initialState, getAvailablePaymentMethods]);

  useEffect(() => {
    if (addresses.length > 0 && !state.deliveryAddress) {
      const defaultDelivery = addresses.find((a) => a.isDefaultDelivery);
      const defaultBilling = addresses.find((a) => a.isDefaultBilling);

      if (defaultDelivery) {
        dispatch({ type: "SET_DELIVERY_ADDRESS", payload: defaultDelivery });
      } else {
        dispatch({ type: "SET_DELIVERY_ADDRESS", payload: addresses[0] });
      }

      if (defaultBilling) {
        dispatch({ type: "SET_BILLING_ADDRESS", payload: defaultBilling });
        if (defaultDelivery?.id !== defaultBilling.id) {
          dispatch({
            type: "SET_BILLING_ADDRESS_SAME_AS_DELIVERY",
            payload: false,
          });
        }
      } else {
        dispatch({
          type: "SET_BILLING_ADDRESS",
          payload: defaultDelivery || addresses[0],
        });
      }
    }
  }, [addresses, state.deliveryAddress]);

  const setCurrentStep = useCallback((step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  const canProceedToNext = useCallback((): boolean => {
    switch (state.currentStep) {
      case 1:
        return (
          !!state.deliveryAddress &&
          (state.billingAddressSameAsDelivery || !!state.billingAddress)
        );
      case 2:
        return !!state.selectedPaymentMethod;
      case 3:
        return state.agreedToTerms;
      default:
        return false;
    }
  }, [state]);

  const setDeliveryAddress = useCallback((address: Address) => {
    dispatch({ type: "SET_DELIVERY_ADDRESS", payload: address });
  }, []);

  const setBillingAddress = useCallback((address: Address | null) => {
    dispatch({ type: "SET_BILLING_ADDRESS", payload: address });
  }, []);

  const setBillingAddressSameAsDelivery = useCallback((same: boolean) => {
    dispatch({ type: "SET_BILLING_ADDRESS_SAME_AS_DELIVERY", payload: same });
  }, []);

  const setPaymentMethod = useCallback((method: CheckoutPaymentMethod) => {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method });
  }, []);

  const setAgreedToTerms = useCallback((agreed: boolean) => {
    dispatch({ type: "SET_AGREED_TO_TERMS", payload: agreed });
  }, []);

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: "SET_NOTES", payload: notes });
  }, []);

  const resetCheckout = useCallback(() => {
    dispatch({ type: "RESET_CHECKOUT_WITH_STATE", payload: initialState });
  }, [initialState]);

  const value: CheckoutContextType = useMemo(
    () => ({
      state,
      setCurrentStep,
      nextStep,
      prevStep,
      canProceedToNext,
      setDeliveryAddress,
      setBillingAddress,
      setBillingAddressSameAsDelivery,
      setPaymentMethod,
      getAvailablePaymentMethods,
      setAgreedToTerms,
      resetCheckout,
      setNotes,
    }),
    [state, canProceedToNext]
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

// 3. Hook'u oluştur
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}
