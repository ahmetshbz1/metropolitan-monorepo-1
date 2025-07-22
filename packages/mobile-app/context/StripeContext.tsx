//  "StripeContext.tsx"
//  metropolitan app
//  Created by Ahmet on 27.01.2025.

import { StripeProvider } from "@stripe/stripe-react-native";
import React, { createContext, useContext, type ReactNode } from "react";
import { STRIPE_CONFIG } from "../config/stripe";

export interface StripeContextType {
  // Bu context gelecekte Stripe ile ilgili ek state'ler için kullanılabilir
  isReady: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProviderWrapper: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <StripeProvider
      publishableKey={STRIPE_CONFIG.publishableKey}
      merchantIdentifier={STRIPE_CONFIG.merchantIdentifier}
      urlScheme={STRIPE_CONFIG.urlScheme}
    >
      <StripeContext.Provider value={{ isReady: true }}>
        {children}
      </StripeContext.Provider>
    </StripeProvider>
  );
};

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error(
      "useStripeContext must be used within a StripeProviderWrapper"
    );
  }
  return context;
};
