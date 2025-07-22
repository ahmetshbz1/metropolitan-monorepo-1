//  "CartItem.tsx"
//  metropolitan app
//  Created by Ahmet on 22.06.2025.

import { CartItem as CartItemType } from "@/context/CartContext";
import { useCartItem } from "@/hooks/useCartItem";
import React from "react";
import { Swipeable } from "react-native-gesture-handler";
import { CartItemContent } from "./CartItemContent";
import { useCartItemSwipeActions } from "./CartItemSwipeActions";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const cartItemData = useCartItem(item);

  const { renderRightActions } = useCartItemSwipeActions({
    onDelete: () => cartItemData?.handleDelete(onRemove) || (() => {}),
  });

  if (!cartItemData) {
    // Product not found
    return null;
  }

  const {
    product,
    totalItemPrice,
    colors,
    colorScheme,
    summary,
    handleProductPress,
    handleIncrement,
    handleDecrement,
    handleSwipeWillOpen,
  } = cartItemData;

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
      friction={2}
      onSwipeableWillOpen={handleSwipeWillOpen}
    >
      <CartItemContent
        item={item}
        product={product}
        totalItemPrice={totalItemPrice}
        colors={colors}
        colorScheme={colorScheme}
        summary={summary}
        onProductPress={handleProductPress}
        onIncrement={() => handleIncrement(onUpdateQuantity)}
        onDecrement={() => handleDecrement(onUpdateQuantity)}
      />
    </Swipeable>
  );
}
