//  "PurchaseSection.tsx"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BaseButton } from "@/components/base/BaseButton";
import { HapticIconButton } from "@/components/HapticButton";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { Product } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/useToast";

interface PurchaseSectionProps {
  product: Product;
}

export function PurchaseSection({ product }: PurchaseSectionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addToCart, cartItems } = useCart();
  const { showToast } = useToast();
  const { triggerHaptic } = useHaptics();

  // Ürün sepette mi kontrol et
  const existingCartItem = cartItems.find(
    (item) => item.product.id === product.id
  );
  
  const [quantity, setQuantity] = useState(
    existingCartItem ? String(existingCartItem.quantity) : "1"
  );
  const [isAdded, setIsAdded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sepet güncellendiğinde miktarı güncelle
  useEffect(() => {
    const currentCartItem = cartItems.find(
      (item) => item.product.id === product.id
    );
    if (currentCartItem) {
      setQuantity(String(currentCartItem.quantity));
    } else {
      // Ürün sepetten çıkarıldıysa miktarı 1'e sıfırla
      setQuantity("1");
    }
  }, [cartItems, product.id]);

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
    const numQuantity = parseInt(quantity, 10) || 1;
    
    const cartItem = cartItems.find(
      (item) => item.product.id === product.id
    );
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

    try {
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
    } catch (error: any) {
      console.error("Sepete ekleme hatası:", error);
      
      // useCartState'ten gelen structured error'ı handle et
      if (error.key) {
        // Structured error message'ı direkt kullan (zaten çevrilmiş)
        showToast(error.message, "error");
      } else if (error.code === "AUTH_REQUIRED") {
        // Auth error'ı handle et
        showToast(error.message, "warning");
      } else {
        // Generic error
        showToast(t("product_detail.purchase.generic_error_message"), "error");
      }
      throw error;
    }
  };

  const handleQuantityChange = (text: string) => {
    setQuantity(text.replace(/[^0-9]/g, ""));
  };

  const handleQuantityBlur = () => {
    const num = parseInt(quantity, 10);
    if (isNaN(num) || num < 1) {
      setQuantity("1");
    } else if (num > product.stock) {
      setQuantity(String(product.stock));
    }
  };

  const updateQuantity = (amount: number) => {
    const currentQuantity = parseInt(quantity, 10) || 0;
    const newQuantity = currentQuantity + amount;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(String(newQuantity));
    }
  };

  const numericQuantity = parseInt(quantity, 10) || 0;
  
  // Buton durumunu belirle
  const currentCartItem = cartItems.find(
    (item) => item.product.id === product.id
  );
  const isInCart = !!currentCartItem;
  const isSameQuantity = currentCartItem && currentCartItem.quantity === numericQuantity;

  return (
    <ThemedView
      className="flex-row items-center px-5 pt-4 border-t"
      style={{
        paddingBottom: insets.bottom,
        borderTopColor: colors.borderColor,
        backgroundColor: colors.cardBackground,
      }}
    >
      <View
        className="flex-row items-center rounded-xl border overflow-hidden"
        style={{ borderColor: colors.borderColor }}
      >
        <HapticIconButton
          className="w-12 h-12 items-center justify-center"
          onPress={() => updateQuantity(-1)}
          hapticType="light"
          disabled={numericQuantity <= 1}
        >
          <Ionicons
            name="remove"
            size={22}
            color={numericQuantity <= 1 ? colors.mediumGray : colors.text}
          />
        </HapticIconButton>
        <TextInput
          className="text-lg font-bold text-center"
          style={{
            color: colors.text,
            minWidth: 50,
            height: "100%",
            textAlignVertical: "center",
            paddingVertical: 0,
            includeFontPadding: false,
            lineHeight: 20,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: colors.borderColor,
            backgroundColor: colors.card,
          }}
          value={quantity}
          onChangeText={handleQuantityChange}
          onBlur={handleQuantityBlur}
          keyboardType="number-pad"
          maxLength={3}
          selectTextOnFocus
        />
        <HapticIconButton
          className="w-12 h-12 items-center justify-center"
          onPress={() => updateQuantity(1)}
          hapticType="light"
          disabled={numericQuantity >= product.stock}
        >
          <Ionicons
            name="add"
            size={22}
            color={
              numericQuantity >= product.stock ? colors.mediumGray : colors.text
            }
          />
        </HapticIconButton>
      </View>
      {isInCart && isSameQuantity ? (
        <Link href="/(tabs)/cart" asChild className="flex-1 ml-2">
          <BaseButton
            variant="success"
            size="medium"
            hapticType="medium"
          >
            <Text className="text-base font-bold" style={{ color: "#FFFFFF" }}>
              {t("product_detail.purchase.go_to_cart")}
            </Text>
          </BaseButton>
        </Link>
      ) : (
        <BaseButton
          className="flex-1 ml-2"
          variant={isAdded ? "success" : "primary"}
          size="medium"
          onPress={handleAddToCart}
          hapticType={isAdded ? "success" : "medium"}
          disabled={product.stock === 0 || numericQuantity === 0}
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
