//  "[id].tsx"
//  metropolitan app
//  Created by Ahmet on 06.07.2025.

import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useNavigation } from "expo-router";
import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";

import { HapticIconButton } from "@/components/HapticButton";
import { ProductImage } from "@/components/product-detail/ProductImage";
import { ProductInfo } from "@/components/product-detail/ProductInfo";
import { PurchaseSection } from "@/components/product-detail/PurchaseSection";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, loadingProducts } = useProducts();
  const { t } = useTranslation();
  const { cartItems } = useCart();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const product = products.find((p) => p.id === id);

  // Klavye açıldığında içeriğin en alta kayması için ScrollView referansı
  const scrollViewRef = useRef<ScrollView>(null);
  const cartItemCount = cartItems.length;

  // Native header'a ürün adını ve butonları dinamik olarak ekle
  useLayoutEffect(() => {
    if (product) {
      navigation.setOptions({
        headerTitle: product.name,
        headerRight: () => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginRight: -12,
            }}
          >
            <Link href="/(tabs)/cart" asChild>
              <HapticIconButton hapticType="light" style={{ padding: 8 }}>
                <View style={{ position: "relative" }}>
                  <Ionicons name="cart-outline" size={24} color={colors.text} />
                  {cartItemCount > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        backgroundColor: colors.tint,
                        right: -10,
                        top: -5,
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        justifyContent: "center",
                        alignItems: "center",
                        ...(cartItemCount > 99 && { width: 28, right: -15 }),
                      }}
                    >
                      <Text
                        style={{
                          fontSize: cartItemCount > 99 ? 10 : 12,
                          lineHeight: 20,
                          color: "#FFFFFF",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </Text>
                    </View>
                  )}
                </View>
              </HapticIconButton>
            </Link>
          </View>
        ),
      });
    }
  }, [navigation, product, cartItemCount, colors]);


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
          <ProductInfo product={product} />
        </KeyboardAwareScrollView>
        <PurchaseSection product={product} />
      </KeyboardStickyView>
    </ThemedView>
  );
}
