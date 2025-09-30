//  "useProductsSection.ts"
//  metropolitan app
//  Created by Ahmet on 17.06.2025.

import { useCart } from "@/context/CartContext";
import { OrderItem, useOrders } from "@/context/OrderContext";
import { useProducts } from "@/context/ProductContext";
import { useHaptics } from "@/hooks/useHaptics";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useToast } from "@/hooks/useToast";

export const useProductsSection = (items: OrderItem[]) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { products } = useProducts();
  const { selectedOrder } = useOrders();
  const { addToCart } = useCart();
  const { triggerHaptic } = useHaptics();
  const { dialogState, showDialog, hideDialog, handleConfirm } = useConfirmationDialog();
  const { showToast } = useToast();

  const getProductImage = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.image || undefined;
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleReorder = async () => {
    triggerHaptic();
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

        showDialog({
          title: t("order_detail.reorder.stock_warning_title"),
          message: message,
          icon: "warning-outline",
          confirmText: t("order_detail.reorder.add_available_stock"),
          cancelText: t("common.cancel"),
          destructive: false,
          onConfirm: async () => {
            await addAvailableStock(stockChecks);
          },
        });
      } else {
        // Tüm ürünler için stok yeterli
        await addAllItemsToCart(items);
      }
    } catch (error) {
      // Removed console statement
      showToast(t("order_detail.reorder.error_message"), "error");
    }
  };

  const addAvailableStock = async (stockChecks: any[]) => {
    try {
      // Sadece stokta bulunan ürünleri ekle
      const availableItems = stockChecks.filter(item => item.availableStock > 0);

      for (const item of availableItems) {
        const quantityToAdd = Math.min(item.quantity, item.availableStock);
        // Removed console statement`);

        try {
          await addToCart(item.product.id, quantityToAdd);
        } catch (error) {
          // Removed console statement
          // Tek bir ürün eklenemezse diğerlerini denemeye devam et
          continue;
        }
      }

      showDialog({
        title: t("order_detail.reorder.success_title"),
        message: t("order_detail.reorder.partial_success_message"),
        icon: "checkmark-circle-outline",
        confirmText: t("order_detail.reorder.go_to_cart"),
        cancelText: t("order_detail.reorder.stay_on_orders"),
        destructive: false,
        onConfirm: async () => {
          router.push("/(tabs)/cart");
        },
      });
    } catch (error) {
      // Removed console statement
      showToast(t("order_detail.reorder.error_message"), "error");
    }
  };

  const addAllItemsToCart = async (items: OrderItem[]) => {
    try {
      await Promise.all(
        items.map((item) => addToCart(item.product.id, item.quantity))
      );

      showDialog({
        title: t("order_detail.reorder.success_title"),
        message: t("order_detail.reorder.success_message"),
        icon: "checkmark-circle-outline",
        confirmText: t("order_detail.reorder.go_to_cart"),
        cancelText: t("order_detail.reorder.stay_on_orders"),
        destructive: false,
        onConfirm: async () => {
          router.push("/(tabs)/cart");
        },
      });
    } catch (error) {
      // Removed console statement
      showToast(t("order_detail.reorder.error_message"), "error");
    }
  };

  return {
    selectedOrder,
    getProductImage,
    handleProductPress,
    handleReorder,
    dialogState,
    hideDialog,
    handleConfirm,
    t,
  };
};
