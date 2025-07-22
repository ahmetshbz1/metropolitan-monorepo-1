//  "CartContent.tsx"
//  metropolitan app
//  Created by Ahmet on 06.06.2025.

import { FlatList, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  CartItem as CartItemType,
  CartSummary as CartSummaryType,
} from "@/context/CartContext";

import { CartItem } from "./CartItem";
import { CartSummary, useCartSummaryHeight } from "./CartSummary";

interface CartContentProps {
  cartItems: CartItemType[];
  summary: CartSummaryType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  isCheckingOut?: boolean;
}

export function CartContent({
  cartItems,
  summary,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isCheckingOut,
}: CartContentProps) {
  const cartSummaryHeight = useCartSummaryHeight();

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 relative">
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CartItem
              item={item}
              onUpdateQuantity={(quantity) =>
                onUpdateQuantity(item.id, quantity)
              }
              onRemove={() => onRemoveItem(item.id)}
            />
          )}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: cartSummaryHeight + 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        />

        <CartSummary
          summary={summary}
          onCheckout={onCheckout}
          isCheckingOut={isCheckingOut}
        />
      </View>
    </GestureHandlerRootView>
  );
}
