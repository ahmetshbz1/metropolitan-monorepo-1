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
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, View, Share } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { HapticIconButton } from "@/components/HapticButton";
import { Ionicons } from "@expo/vector-icons";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, loadingProducts } = useProducts();
  const { t } = useTranslation();
  const { cartItems } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { triggerHaptic } = useHaptics();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { user } = useAuth();

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

  // Kullanıcı tipine göre minimum adet
  const minQuantity = useMemo(() => {
    if (!product) return 1;
    const userType = user?.userType || "individual";
    return userType === "corporate"
      ? (product.minQuantityCorporate ?? 1)
      : (product.minQuantityIndividual ?? 1);
  }, [product, user?.userType]);

  const [quantity, setQuantity] = useState(
    existingCartItem ? String(existingCartItem.quantity) : String(minQuantity)
  );

  // Update quantity when cart changes or minQuantity changes
  useEffect(() => {
    const currentCartItem = cartItems.find(
      (item) => item.product.id === product?.id
    );
    if (currentCartItem) {
      setQuantity(String(currentCartItem.quantity));
    } else {
      setQuantity(String(minQuantity));
    }
  }, [cartItems, product?.id, minQuantity]);

  // Optimize quantity handlers
  const handleQuantityChange = useCallback((text: string) => {
    setQuantity(text.replace(/[^0-9]/g, ""));
  }, []);

  const handleQuantityBlur = useCallback(() => {
    if (!product) return;
    const num = parseInt(quantity, 10);
    if (isNaN(num) || num < minQuantity) {
      setQuantity(String(minQuantity));
    } else if (num > product.stock) {
      setQuantity(String(product.stock));
    }
  }, [product, quantity, minQuantity]);

  const updateQuantity = useCallback((amount: number) => {
    if (!product) return;
    const currentQuantity = parseInt(quantity, 10) || 0;
    const newQuantity = currentQuantity + amount;
    if (newQuantity >= minQuantity && newQuantity <= product.stock) {
      setQuantity(String(newQuantity));
    }
  }, [product, quantity, minQuantity]);

  const handleToggleFavorite = useCallback(() => {
    if (!product) return;
    triggerHaptic();
    toggleFavorite(product);
  }, [product, triggerHaptic, toggleFavorite]);

  const isProductFavorite = product ? isFavorite(product.id) : false;

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

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name} - ${t("product_detail.share.check_out_this_product")}`,
        title: product.name,
      });
      triggerHaptic();
    } catch (error) {
      // Removed console statement
    }
  }, [product, t, triggerHaptic]);

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

        <HapticIconButton
          onPress={handleShare}
          className="absolute justify-center items-center z-50"
          style={{
            bottom: 160,
            right: 16,
            width: 48,
            height: 48,
            backgroundColor: colors.cardBackground,
            borderRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Ionicons
            name="share-outline"
            size={24}
            color={colors.darkGray}
          />
        </HapticIconButton>

        <HapticIconButton
          onPress={handleToggleFavorite}
          className="absolute justify-center items-center z-50"
          style={{
            bottom: 100,
            right: 16,
            width: 48,
            height: 48,
            backgroundColor: colors.cardBackground,
            borderRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Ionicons
            name={isProductFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isProductFavorite ? "#EF4444" : colors.darkGray}
          />
        </HapticIconButton>

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