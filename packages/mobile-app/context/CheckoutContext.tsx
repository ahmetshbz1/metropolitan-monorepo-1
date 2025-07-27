//  "CheckoutContext.tsx"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.
//  Last Modified by Ahmet on 15.07.2025.

import { useAddresses } from "@/context/AddressContext";
import { useAuth } from "@/context/AuthContext";
import { checkoutReducer } from "@/context/checkout/reducer";
import { getAvailablePaymentMethods } from "@/context/checkout/paymentMethods";
import { handleAddressDefaults } from "@/context/checkout/effects";
import { useCheckoutActions } from "@/context/checkout/hooks";
import type {
  CheckoutContextType,
  CheckoutState,
} from "@metropolitan/shared";
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

  const [state, dispatch] = useReducer(
    (state: CheckoutState, action: any) =>
      checkoutReducer(state, action, initialState),
    initialState
  );

  const actions = useCheckoutActions(state, dispatch);

  const getPaymentMethods = useCallback(() => {
    return getAvailablePaymentMethods(t, user?.userType);
  }, [t, user?.userType]);

  const resetCheckout = useCallback(() => {
    dispatch({ type: "RESET_CHECKOUT_WITH_STATE", payload: initialState });
  }, [initialState]);

  useEffect(() => {
    const updatedState = {
      ...initialState,
      paymentMethods: getPaymentMethods(),
    };
    dispatch({ type: "RESET_CHECKOUT_WITH_STATE", payload: updatedState });
  }, [initialState, getPaymentMethods]);

  useEffect(() => {
    handleAddressDefaults(addresses, state, dispatch);
  }, [addresses, state.deliveryAddress]);

  const value: CheckoutContextType = useMemo(
    () => ({
      state,
      ...actions,
      getAvailablePaymentMethods: getPaymentMethods,
      resetCheckout,
    }),
    [state, actions, getPaymentMethods, resetCheckout]
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
