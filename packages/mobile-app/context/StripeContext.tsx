//  "StripeContext.tsx"
//  metropolitan app
//  Created by Ahmet on 27.01.2025.

import { StripeProvider } from "@stripe/stripe-react-native";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "../core/api";

export interface StripeContextType {
  // Bu context gelecekte Stripe ile ilgili ek state'ler için kullanılabilir
  isReady: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProviderWrapper: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStripeConfig = async () => {
      try {
        const response = await api.get("/payment/config");
        if (response.data?.data?.publishableKey) {
          setPublishableKey(response.data.data.publishableKey);
          console.log(`Stripe ${response.data.data.mode} mode initialized`);
        }
      } catch (error) {
        console.error("Failed to fetch Stripe config:", error);
        // Fallback to environment variable if API fails
        const envKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (envKey) {
          setPublishableKey(envKey);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStripeConfig();
  }, []);

  if (isLoading || !publishableKey) {
    // Return children without Stripe provider while loading
    return (
      <StripeContext.Provider value={{ isReady: false }}>
        {children}
      </StripeContext.Provider>
    );
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.metropolitan.food"
      urlScheme="metropolitan"
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
