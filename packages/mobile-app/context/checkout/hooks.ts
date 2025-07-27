//  "hooks.ts"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.

import { useCallback } from "react";
import { Address } from "@metropolitan/shared/types/address";
import { CheckoutPaymentMethod, CheckoutState, Action } from "@metropolitan/shared/types/checkout";

export const useCheckoutActions = (
  state: CheckoutState,
  dispatch: React.Dispatch<Action>
) => {
  const setCurrentStep = useCallback((step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  }, [dispatch]);

  const nextStep = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, [dispatch]);

  const prevStep = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, [dispatch]);

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
  }, [dispatch]);

  const setBillingAddress = useCallback((address: Address | null) => {
    dispatch({ type: "SET_BILLING_ADDRESS", payload: address });
  }, [dispatch]);

  const setBillingAddressSameAsDelivery = useCallback((same: boolean) => {
    dispatch({ type: "SET_BILLING_ADDRESS_SAME_AS_DELIVERY", payload: same });
  }, [dispatch]);

  const setPaymentMethod = useCallback((method: CheckoutPaymentMethod) => {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method });
  }, [dispatch]);

  const setAgreedToTerms = useCallback((agreed: boolean) => {
    dispatch({ type: "SET_AGREED_TO_TERMS", payload: agreed });
  }, [dispatch]);

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: "SET_NOTES", payload: notes });
  }, [dispatch]);

  return {
    setCurrentStep,
    nextStep,
    prevStep,
    canProceedToNext,
    setDeliveryAddress,
    setBillingAddress,
    setBillingAddressSameAsDelivery,
    setPaymentMethod,
    setAgreedToTerms,
    setNotes,
  };
};