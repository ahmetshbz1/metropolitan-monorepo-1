//  "reducer.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.

import type { Action, CheckoutState } from "@metropolitan/shared";

export const checkoutReducer = (
  state: CheckoutState,
  action: Action,
  initialState: CheckoutState
): CheckoutState => {
  switch (action.type) {
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };
    case "NEXT_STEP":
      return { ...state, currentStep: state.currentStep + 1 };
    case "PREV_STEP":
      return { ...state, currentStep: state.currentStep - 1 };
    case "SET_DELIVERY_ADDRESS":
      return { ...state, deliveryAddress: action.payload };
    case "SET_BILLING_ADDRESS":
      return { ...state, billingAddress: action.payload };
    case "SET_BILLING_ADDRESS_SAME_AS_DELIVERY":
      return {
        ...state,
        billingAddressSameAsDelivery: action.payload,
        billingAddress: action.payload ? null : state.billingAddress,
      };
    case "SET_PAYMENT_METHOD":
      return { ...state, selectedPaymentMethod: action.payload };
    case "SET_AGREED_TO_TERMS":
      return { ...state, agreedToTerms: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "RESET_CHECKOUT":
      return initialState;
    case "RESET_CHECKOUT_WITH_STATE":
      return action.payload;
    default:
      return state;
  }
};
