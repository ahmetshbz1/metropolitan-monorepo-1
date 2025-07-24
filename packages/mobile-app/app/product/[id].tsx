//  "[id].tsx"
//  metropolitan app
//  Created by Ahmet on 06.07.2025.

import { ProductImage } from "@/components/product-detail/ProductImage";
import { ProductInfo } from "@/components/product-detail/ProductInfo";
import { PurchaseSection } from "@/components/product-detail/PurchaseSection";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, loadingProducts } = useProducts();
  const { t } = useTranslation();
  const { cartItems } = useCart();
  const navigation = useNavigation();

  const product = products.find((p) => p.id === id);

  // Quantity state - ProductInfo ve PurchaseSection arasında paylaşılacak
  const existingCartItem = cartItems.find(
    (item) => item.product.id === product?.id
  );

  const [quantity, setQuantity] = useState(
    existingCartItem ? String(existingCartItem.quantity) : "1"
  );

  // Sepet güncellendiğinde miktarı güncelle
  useEffect(() => {
    const currentCartItem = cartItems.find(
      (item) => item.product.id === product?.id
    );
    if (currentCartItem) {
      setQuantity(String(currentCartItem.quantity));
    } else {
      // Ürün sepetten çıkarıldıysa miktarı 1'e sıfırla
      setQuantity("1");
    }
  }, [cartItems, product?.id]);

  const handleQuantityChange = (text: string) => {
    setQuantity(text.replace(/[^0-9]/g, ""));
  };

  const handleQuantityBlur = () => {
    if (!product) return;
    const num = parseInt(quantity, 10);
    if (isNaN(num) || num < 1) {
      setQuantity("1");
    } else if (num > product.stock) {
      setQuantity(String(product.stock));
    }
  };

  const updateQuantity = (amount: number) => {
    if (!product) return;
    const currentQuantity = parseInt(quantity, 10) || 0;
    const newQuantity = currentQuantity + amount;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(String(newQuantity));
    }
  };

  // Klavye açıldığında içeriğin en alta kayması için ScrollView referansı
  const scrollViewRef = useRef<ScrollView>(null);

  // Native header'a ürün adını ekle
  useLayoutEffect(() => {
    if (product) {
      navigation.setOptions({
        headerTitle: product.name,
      });
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
        <KeyboardAwareScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bottomOffset={100} // PurchaseSection yüksekliği için space
          extraKeyboardSpace={20} // Ekstra boşluk
        >
          <ProductImage product={product} />
          <ProductInfo
            product={product}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            onQuantityBlur={handleQuantityBlur}
            onUpdateQuantity={updateQuantity}
          />
        </KeyboardAwareScrollView>
        <PurchaseSection
          product={product}
          quantity={quantity}
          onQuantityChange={handleQuantityChange}
          onQuantityBlur={handleQuantityBlur}
          onUpdateQuantity={updateQuantity}
        />
      </KeyboardStickyView>
    </ThemedView>
  );
}
