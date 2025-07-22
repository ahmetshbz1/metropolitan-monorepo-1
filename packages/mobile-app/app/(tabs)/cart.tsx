//  "cart.tsx"
//  metropolitan app
//  Created by Ahmet on 26.06.2025.

import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

import { CartContent } from "@/components/cart/CartContent";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/useToast";

export default function CartScreen() {
  const { cartItems, summary, updateQuantity, removeItem, isLoading } =
    useCart();
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (error: any) {
      showToast(error.message || t("cart.remove_error"), "error");
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch (error: any) {
      // Structured error handling
      if (error.code === "MIN_QUANTITY_ERROR") {
        showToast(error.message, "warning");
      } else if (error.key) {
        // Backend error with key
        showToast(error.message, "error");
      } else {
        // Generic error
        showToast(error.message || t("cart.update_error"), "error");
      }
    }
  };

  const handleCheckoutPress = () => {
    if (isGuest && !user) {
      router.push("/(auth)?from=checkout");
      return;
    }
    router.push("/checkout");
  };

  if (isLoading) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (cartItems.length === 0 || !summary) {
    return (
      <ThemedView className="flex-1">
        <EmptyCart />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <CartContent
        cartItems={cartItems}
        summary={summary}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckoutPress}
        isCheckingOut={false}
      />
    </ThemedView>
  );
}
