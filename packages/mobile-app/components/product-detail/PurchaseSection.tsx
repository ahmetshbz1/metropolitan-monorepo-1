//  "PurchaseSection.tsx"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BaseButton } from "@/components/base/BaseButton";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/useToast";
import type { Product } from "@metropolitan/shared";
import { StructuredError } from "@/types/error.types";

interface PurchaseSectionProps {
  product: Product;
  quantity: string;
  onQuantityChange: (text: string) => void;
  onQuantityBlur: () => void;
  onUpdateQuantity: (amount: number) => void;
}

export function PurchaseSection({
  product,
  quantity,
  onQuantityChange,
  onQuantityBlur,
  onUpdateQuantity,
}: PurchaseSectionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addToCart, cartItems } = useCart();
  const { showToast } = useToast();
  const { triggerHaptic } = useHaptics();
  const router = useRouter();


  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup için useEffect
  useEffect(() => {
    return () => {
      // Component unmount olduğunda timeout'u temizle
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleAddToCart = async () => {
    setIsLoading(true);

    try {
      const numQuantity = parseInt(quantity, 10) || 1;

      const cartItem = cartItems.find((item) => item.product.id === product.id);
      const existingQuantity = cartItem ? cartItem.quantity : 0;

      if (existingQuantity === 0 && numQuantity > product.stock) {
        showToast(
          t("product_detail.purchase.stock_error_message", {
            count: product.stock,
          }),
          "warning"
        );
        throw new Error("Stock limit exceeded");
      }

      await addToCart(product.id, numQuantity);

      // Başarılı ekleme/güncelleme sonrası hafif titreşim
      triggerHaptic("light", true);

      if (!cartItem) {
        // Yeni ekleme ise geçici olarak "Sepete Eklendi" göster
        setIsAdded(true);

        // Önceki timeout'u temizle
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Yeni timeout oluştur
        timeoutRef.current = setTimeout(() => {
          setIsAdded(false);
          timeoutRef.current = null;
        }, 2000);
      }
    } catch (error) {
      console.error("Sepete ekleme hatası:", error);
      const structuredError = error as StructuredError;

      // useCartState'ten gelen structured error'ı handle et
      if (structuredError.key) {
        // Structured error message'ı direkt kullan (zaten çevrilmiş)
        showToast(structuredError.message, "error");
      } else if (structuredError.code === "AUTH_REQUIRED") {
        // Auth error'ı handle et
        showToast(structuredError.message, "warning");
      } else {
        // Generic error
        showToast(t("product_detail.purchase.generic_error_message"), "error");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };




  const numericQuantity = parseInt(quantity, 10) || 0;

  // Buton durumunu belirle
  const currentCartItem = cartItems.find(
    (item) => item.product.id === product.id
  );
  const isInCart = !!currentCartItem;
  const isSameQuantity =
    currentCartItem && currentCartItem.quantity === numericQuantity;

  return (
    <ThemedView
      className="px-5 pt-4 border-t"
      style={{
        paddingBottom: insets.bottom,
        borderTopColor: colors.borderColor,
        backgroundColor: colors.cardBackground,
      }}
    >
      {isInCart && isSameQuantity ? (
        <BaseButton
          variant="success"
          size="small"
          hapticType="medium"
          onPress={() => {
            setIsNavigating(true);
            // Kısa bir delay ile navigation'ı simüle et
            setTimeout(() => {
              router.push("/(tabs)/cart");
              setIsNavigating(false);
            }, 300);
          }}
          loading={isNavigating}
          disabled={isNavigating}
          fullWidth
        >
          <Text className="text-base font-bold" style={{ color: "#FFFFFF" }}>
            {t("product_detail.purchase.go_to_cart")}
          </Text>
        </BaseButton>
      ) : (
        <BaseButton
          variant={isAdded ? "success" : "primary"}
          size="small"
          onPress={handleAddToCart}
          hapticType={isAdded ? "success" : "medium"}
          disabled={product.stock === 0 || numericQuantity === 0 || isLoading}
          loading={isLoading}
          fullWidth
        >
          <Text className="text-base font-bold" style={{ color: "#FFFFFF" }}>
            {product.stock === 0
              ? t("product_detail.purchase.out_of_stock")
              : isAdded
                ? t("product_detail.purchase.added_to_cart")
                : isInCart
                  ? t("product_detail.purchase.update_cart")
                  : t("product_detail.purchase.add_to_cart")}
          </Text>
        </BaseButton>
      )}
    </ThemedView>
  );
}
