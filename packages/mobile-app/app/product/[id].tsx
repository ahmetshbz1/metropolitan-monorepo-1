//  "[id].tsx"
//  metropolitan app
//  Created by Ahmet on 06.07.2025.

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ProductImage } from "@/components/product-detail/ProductImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState, Suspense, lazy, startTransition, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, View, InteractionManager } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

// Lazy load heavy components
const ProductInfo = lazy(() => import("@/components/product-detail/ProductInfo").then(module => ({ default: module.ProductInfo })));
const PurchaseSection = lazy(() => import("@/components/product-detail/PurchaseSection").then(module => ({ default: module.PurchaseSection })));
const SimilarProducts = lazy(() => import("@/components/product-detail/SimilarProducts").then(module => ({ default: module.SimilarProducts })));

// Loading component for Suspense
const ComponentLoader = () => (
  <ThemedView className="justify-center items-center p-4">
    <ActivityIndicator size="small" />
  </ThemedView>
);

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

  // Optimize cart quantity updates with startTransition
  useEffect(() => {
    const currentCartItem = cartItems.find(
      (item) => item.product.id === product?.id
    );

    // Use startTransition for non-urgent updates
    startTransition(() => {
      if (currentCartItem) {
        setQuantity(String(currentCartItem.quantity));
      } else {
        setQuantity("1");
      }
    });
  }, [cartItems, product?.id]);

  // Optimize quantity change handlers with useCallback
  const handleQuantityChange = useCallback((text: string) => {
    startTransition(() => {
      setQuantity(text.replace(/[^0-9]/g, ""));
    });
  }, []);

  const handleQuantityBlur = useCallback(() => {
    if (!product) return;

    // Use InteractionManager for heavy computation
    InteractionManager.runAfterInteractions(() => {
      const num = parseInt(quantity, 10);
      startTransition(() => {
        if (isNaN(num) || num < 1) {
          setQuantity("1");
        } else if (num > product.stock) {
          setQuantity(String(product.stock));
        }
      });
    });
  }, [product, quantity]);

  const updateQuantity = useCallback((amount: number) => {
    if (!product) return;

    const currentQuantity = parseInt(quantity, 10) || 0;
    const newQuantity = currentQuantity + amount;

    startTransition(() => {
      if (newQuantity >= 1 && newQuantity <= product.stock) {
        setQuantity(String(newQuantity));
      }
    });
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
          {/* Suspense boundary for ProductInfo - ağır komponent */}
          <Suspense fallback={<ComponentLoader />}>
            <ProductInfo
              product={product}
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
              onQuantityBlur={handleQuantityBlur}
              onUpdateQuantity={updateQuantity}
            />
          </Suspense>

          {/* Suspense boundary for SimilarProducts - API heavy */}
          <Suspense fallback={<ComponentLoader />}>
            {product && <SimilarProducts currentProduct={product} />}
          </Suspense>
        </ParallaxScrollView>

        {/* Suspense boundary for PurchaseSection */}
        <Suspense fallback={<ComponentLoader />}>
          {product && (
            <PurchaseSection
              product={product}
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
              onQuantityBlur={handleQuantityBlur}
              onUpdateQuantity={updateQuantity}
            />
          )}
        </Suspense>
      </KeyboardStickyView>
    </ThemedView>
  );
}