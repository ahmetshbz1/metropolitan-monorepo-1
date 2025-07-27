//  "effects.ts"
//  metropolitan app
//  Created by Ahmet on 07.07.2025.

import type { Address, CheckoutState, Action } from "@metropolitan/shared";

export const handleAddressDefaults = (
  addresses: Address[],
  state: CheckoutState,
  dispatch: React.Dispatch<Action>
) => {
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
};