//  "useProductsSection.ts"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import { useCart } from "@/context/CartContext";
import { OrderItem, useOrders } from "@/context/OrderContext";
import { useProducts } from "@/context/ProductContext";
import { useHaptics } from "@/hooks/useHaptics";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const useProductsSection = (items: OrderItem[]) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { products } = useProducts();
  const { selectedOrder } = useOrders();
  const { addToCart } = useCart();
  const { triggerHaptic } = useHaptics();

  const getProductImage = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.image || undefined;
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleReorder = async () => {
    triggerHaptic("medium");
    if (!items || items.length === 0) return;

    try {
      // Her ürün için stok kontrolü yap - ProductContext'ten stok bilgisini al
      const stockChecks = items.map((item) => {
        const productInContext = products.find(p => p.id === item.product.id);
        const availableStock = productInContext?.stock || 0;
        
        return {
          ...item,
          availableStock,
          canAddFull: availableStock >= item.quantity,
        };
      });

      // Stok yetersiz olan ürünleri bul
      const outOfStockItems = stockChecks.filter(item => item.availableStock === 0);
      const insufficientStockItems = stockChecks.filter(item => 
        item.availableStock > 0 && !item.canAddFull
      );

      if (outOfStockItems.length > 0 || insufficientStockItems.length > 0) {
        // Stok problemi var, kullanıcıya bildir
        let message = "";
        
        if (outOfStockItems.length > 0) {
          message += t("order_detail.reorder.out_of_stock_items", { 
            count: outOfStockItems.length 
          });
        }
        
        if (insufficientStockItems.length > 0) {
          if (message) message += "\n\n";
          
          // Yetersiz stok olan ürünleri detaylarıyla göster
          const insufficientDetails = insufficientStockItems
            .map(item => `${item.product.name}: ${item.availableStock} stok`)
            .join("\n");
          
          message += t("order_detail.reorder.insufficient_stock_details", { 
            count: insufficientStockItems.length,
            details: insufficientDetails
          });
        }

        Alert.alert(
          t("order_detail.reorder.stock_warning_title"),
          message,
          [
            {
              text: t("order_detail.reorder.add_available_stock"),
              onPress: async () => {
                await addAvailableStock(stockChecks);
              },
            },
            { text: t("common.cancel"), style: "cancel" },
          ]
        );
      } else {
        // Tüm ürünler için stok yeterli
        await addAllItemsToCart(items);
      }
    } catch (error) {
      console.error("Reorder failed:", error);
      Alert.alert(t("common.error"), t("order_detail.reorder.error_message"));
    }
  };

  const addAvailableStock = async (stockChecks: any[]) => {
    try {
      // Sadece stokta bulunan ürünleri ekle
      const availableItems = stockChecks.filter(item => item.availableStock > 0);
      
      for (const item of availableItems) {
        const quantityToAdd = Math.min(item.quantity, item.availableStock);
        console.log(`Adding ${quantityToAdd} of ${item.product.name} (available: ${item.availableStock})`);
        
        try {
          await addToCart(item.product.id, quantityToAdd);
        } catch (error) {
          console.error(`Failed to add ${item.product.name}:`, error);
          // Tek bir ürün eklenemezse diğerlerini denemeye devam et
          continue;
        }
      }

      Alert.alert(
        t("order_detail.reorder.success_title"),
        t("order_detail.reorder.partial_success_message"),
        [
          {
            text: t("order_detail.reorder.go_to_cart"),
            onPress: () => router.push("/(tabs)/cart"),
          },
          { text: t("common.ok"), style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Partial reorder failed:", error);
      Alert.alert(t("common.error"), t("order_detail.reorder.error_message"));
    }
  };

  const addAllItemsToCart = async (items: OrderItem[]) => {
    try {
      await Promise.all(
        items.map((item) => addToCart(item.product.id, item.quantity))
      );

      Alert.alert(
        t("order_detail.reorder.success_title"),
        t("order_detail.reorder.success_message"),
        [
          {
            text: t("order_detail.reorder.go_to_cart"),
            onPress: () => router.push("/(tabs)/cart"),
          },
          { text: t("common.ok"), style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Full reorder failed:", error);
      Alert.alert(t("common.error"), t("order_detail.reorder.error_message"));
    }
  };

  return {
    selectedOrder,
    getProductImage,
    handleProductPress,
    handleReorder,
    t,
  };
};
