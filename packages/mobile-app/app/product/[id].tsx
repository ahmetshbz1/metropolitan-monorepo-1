//  "[id].tsx"
//  metropolitan app
//  Created by Ahmet on 06.07.2025.

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ProductImage } from "@/components/product-detail/ProductImage";
import { ProductInfo } from "@/components/product-detail/ProductInfo";
import { PurchaseSection } from "@/components/product-detail/PurchaseSection";
import { SimilarProducts } from "@/components/product-detail/SimilarProducts";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, loadingProducts } = useProducts();
  const { t } = useTranslation();
  const { cartItems } = useCart();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Memoize product lookup for better performance
  const product = useMemo(() =>
    products.find((p) => p.id === id),
    [products, id]
  );

  // Memoize existing cart item lookup
  const existingCartItem = useMemo(() =>
    cartItems.find((item) => item.product.id === product?.id),
    [cartItems, product?.id]
  );

  const [quantity, setQuantity] = useState(
    existingCartItem ? String(existingCartItem.quantity) : "1"
  );

  // Update quantity when cart changes
  useEffect(() => {
    const currentCartItem = cartItems.find(
      (item) => item.product.id === product?.id
    );
    if (currentCartItem) {
      setQuantity(String(currentCartItem.quantity));
    } else {
      setQuantity("1");
    }
  }, [cartItems, product?.id]);

  // Optimize quantity handlers
  const handleQuantityChange = useCallback((text: string) => {
    setQuantity(text.replace(/[^0-9]/g, ""));
  }, []);

  const handleQuantityBlur = useCallback(() => {
    if (!product) return;
    const num = parseInt(quantity, 10);
    if (isNaN(num) || num < 1) {
      setQuantity("1");
    } else if (num > product.stock) {
      setQuantity(String(product.stock));
    }
  }, [product, quantity]);

  const updateQuantity = useCallback((amount: number) => {
    if (!product) return;
    const currentQuantity = parseInt(quantity, 10) || 0;
    const newQuantity = currentQuantity + amount;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(String(newQuantity));
    }
  }, [product, quantity]);

  // İlk render'da geri buton başlığını temizle - güçlendirilmiş versiyon
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "", // iOS'ta geri butonunda başlık gösterme
      headerBackTitleVisible: false, // iOS'ta geri butonunda başlığı tamamen gizle
      headerBackButtonDisplayMode: "minimal" as const, // Sadece ok göster
      // iOS-specific ek güvenlik önlemleri
      ...Platform.select({
        ios: {
          headerBackTitleStyle: { fontSize: 0 },
          headerBackButtonMenuEnabled: false,
        },
      }),
    } as any);
  }, [navigation]);

  // Native header'a ürün adını ekle
  useLayoutEffect(() => {
    if (product) {
      navigation.setOptions({
        headerTitle: product.name,
      } as any);
    }
  }, [navigation, product]);

  if (loadingProducts) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 justify-center items-center">
          <ThemedText>{t("product_detail.not_found_body")}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <KeyboardStickyView style={{ flex: 1 }}>
        <ParallaxScrollView
          headerImage={<ProductImage product={product} />}
          headerBackgroundColor={{
            dark: colors.background,
            light: "#ffffff",
          }}
        >
          <ProductInfo
            product={product}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            onQuantityBlur={handleQuantityBlur}
            onUpdateQuantity={updateQuantity}
          />

          {product && <SimilarProducts currentProduct={product} />}
        </ParallaxScrollView>

        {product && (
          <PurchaseSection
            product={product}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            onQuantityBlur={handleQuantityBlur}
            onUpdateQuantity={updateQuantity}
          />
        )}
      </KeyboardStickyView>
    </ThemedView>
  );
}