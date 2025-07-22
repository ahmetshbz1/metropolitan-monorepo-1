//  "AppProviders.tsx"
//  metropolitan app
//  Created by Ahmet on 08.07.2025.

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AddressProvider } from "@/context/AddressContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { OrderProvider } from "@/context/OrderContext";
import { PaymentMethodProvider } from "@/context/PaymentMethodContext";
import { ProductProvider } from "@/context/ProductContext";
import { StripeProviderWrapper } from "@/context/StripeContext";
import { UserSettingsProvider } from "@/context/UserSettings";
import { ToastProvider } from "@/hooks/useToast";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <KeyboardProvider>
      <GestureHandlerRootView className="flex-1">
        <BottomSheetModalProvider>
          <ToastProvider>
            <UserSettingsProvider>
              <AuthProvider>
                <ProductProvider>
                  <AddressProvider>
                    <PaymentMethodProvider>
                      <CartProvider>
                        <FavoritesProvider>
                          <OrderProvider>
                            <StripeProviderWrapper>
                              <SafeAreaProvider>{children}</SafeAreaProvider>
                            </StripeProviderWrapper>
                          </OrderProvider>
                        </FavoritesProvider>
                      </CartProvider>
                    </PaymentMethodProvider>
                  </AddressProvider>
                </ProductProvider>
              </AuthProvider>
            </UserSettingsProvider>
          </ToastProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
};
