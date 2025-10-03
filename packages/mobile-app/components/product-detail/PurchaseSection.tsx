//  "PurchaseSection.tsx"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState, memo, useCallback, startTransition } from "react";
import { useTranslation } from "react-i18next";
import { Text, InteractionManager } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BaseButton } from "@/components/base/BaseButton";
import { ThemedView } from "@/components/ThemedView";
import { MinimumQuantityDialog } from "@/components/products/MinimumQuantityDialog";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/useToast";
import type { Product } from "@metropolitan/shared";
import { StructuredError } from "@/types/error.types";
import { useAuth } from "@/context/AuthContext";

interface PurchaseSectionProps {
  product: Product;
  quantity: string;
  onQuantityChange: (text: string) => void;
  onQuantityBlur: () => void;
  onUpdateQuantity: (amount: number) => void;
}

// Memo optimized component
export const PurchaseSection = memo<PurchaseSectionProps>(function PurchaseSection({
  product,
  quantity,
  onQuantityChange,
  onQuantityBlur,
  onUpdateQuantity,
}) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addToCart, cartItems } = useCart();
  const { showToast } = useToast();
  const { triggerHaptic } = useHaptics();
  const router = useRouter();
  const { user } = useAuth();


  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showMinQuantityDialog, setShowMinQuantityDialog] = useState(false);
  const [minQuantityToAdd, setMinQuantityToAdd] = useState(0);
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

  // Optimize addToCart with useCallback and InteractionManager
  const handleAddToCart = useCallback(async () => {
    startTransition(() => {
      setIsLoading(true);
    });

    try {
      const numQuantity = parseInt(quantity, 10) || 1;

      // Minimum adet kontrolü
      const userType = user?.userType || "individual";
      const minQuantity = userType === "corporate"
        ? (product.minQuantityCorporate ?? 1)
        : (product.minQuantityIndividual ?? 1);

      if (numQuantity < minQuantity) {
        setMinQuantityToAdd(minQuantity);
        setShowMinQuantityDialog(true);
        return; // Dialog göster ve işlemi durdur
      }

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

      // Cart operation - error handling için await kullan
      await addToCart(product.id, numQuantity);

      // Başarılı ekleme/güncelleme sonrası hafif titreşim
      triggerHaptic(true);

      if (!cartItem) {
        // Use startTransition for UI state updates
        startTransition(() => {
          setIsAdded(true);

          // Önceki timeout'u temizle
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Yeni timeout oluştur
          timeoutRef.current = setTimeout(() => {
            startTransition(() => {
              setIsAdded(false);
              timeoutRef.current = null;
            });
          }, 2000);
        });
      }
    } catch (error) {
      console.log("🔴 [PurchaseSection] Error caught:", error);
      const structuredError = error as StructuredError;

      // useCartActions'tan gelen structured error'ı handle et
      if (structuredError.key) {
        console.log("🔴 [PurchaseSection] Showing toast for structured error:", {
          key: structuredError.key,
          message: structuredError.message,
          params: structuredError.params,
        });

        // Stok hatası varsa, maksimum eklenebilir miktarı input'a yaz
        if (structuredError.key === "INSUFFICIENT_STOCK_ALREADY_IN_CART" && structuredError.params?.canAdd) {
          const maxCanAdd = structuredError.params.canAdd;
          const currentInCart = structuredError.params.inCart || 0;

          // canAdd değeri "daha eklenebilecek miktar"
          // Kullanıcı bunu sepete eklerse toplam = currentInCart + canAdd olur
          // Bu da tam stok limitine denk gelir, güvenle kullanabiliriz
          onQuantityChange(String(maxCanAdd));
        } else if (structuredError.key === "INSUFFICIENT_STOCK" && structuredError.params?.stock) {
          // Sepette hiç yok, direkt stok limitini göster
          const maxStock = structuredError.params.stock;
          onQuantityChange(String(maxStock));
        }

        showToast(structuredError.message, "error");
      } else if (structuredError.code === "AUTH_REQUIRED") {
        console.log("🔴 [PurchaseSection] Auth required error");
        showToast(structuredError.message, "warning");
      } else {
        console.log("🔴 [PurchaseSection] Generic error");
        showToast(t("product_detail.purchase.generic_error_message"), "error");
      }
      // Error'u kullanıcıya gösterdik, tekrar fırlatmaya gerek yok
    } finally {
      startTransition(() => {
        setIsLoading(false);
      });
    }
  }, [quantity, cartItems, product.id, product.stock, addToCart, triggerHaptic, showToast, t, user]);




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

      <MinimumQuantityDialog
        visible={showMinQuantityDialog}
        minQuantity={minQuantityToAdd}
        productName={product.name}
        loading={isLoading}
        onConfirm={async () => {
          onUpdateQuantity(minQuantityToAdd - (parseInt(quantity, 10) || 0));
          setShowMinQuantityDialog(false);

          setTimeout(async () => {
            await handleAddToCart();
          }, 100);
        }}
        onCancel={() => {
          setShowMinQuantityDialog(false);
        }}
      />
    </ThemedView>
  );
}, (prevProps, nextProps) => {
  // Optimize memo comparison
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.quantity === nextProps.quantity
  );
});
