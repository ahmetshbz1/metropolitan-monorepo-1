//  "ProductsSection.tsx"
//  metropolitan app
//  Created by Ahmet on 18.06.2025.

import { ThemedText } from "@/components/ThemedText";
import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { OrderItem } from "@/context/OrderContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useProductsSection } from "@/hooks/useProductsSection";
import {
  PRODUCTS_SECTION_CONFIG,
  createProductsSectionStyles,
} from "@/utils/productsSectionStyles";
import React from "react";
import { ScrollView, View } from "react-native";
import { ProductItem } from "./ProductItem";
import { ReorderButton } from "./ReorderButton";

interface ProductsSectionProps {
  items: OrderItem[];
}

export const ProductsSection = ({ items }: ProductsSectionProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const styles = createProductsSectionStyles(colors);

  const {
    selectedOrder,
    getProductImage,
    handleProductPress,
    handleReorder,
    t,
  } = useProductsSection(items);

  if (!items || items.length === 0) {
    return null;
  }

  const shouldEnableScroll =
    items.length > PRODUCTS_SECTION_CONFIG.maxItemsBeforeScroll;

  return (
    <BaseCard style={{ paddingBottom: 0 }}>
      <View className="flex-row justify-between items-center mb-4">
        <ThemedText className="text-lg font-semibold">
          {t("order_detail.products.section_title")}
        </ThemedText>
        <ReorderButton onPress={handleReorder} colors={colors} t={t} />
      </View>

      <ScrollView
        style={styles.scrollView(items.length)}
        nestedScrollEnabled
        scrollEnabled={shouldEnableScroll}
      >
        {items.map((item, index) => (
          <ProductItem
            key={item.id}
            item={item}
            currency={selectedOrder?.order?.currency}
            onPress={handleProductPress}
            getProductImage={getProductImage}
            showDivider={index < items.length - 1}
            colors={colors}
            t={t}
          />
        ))}
      </ScrollView>

      <View className="py-4 mt-1 -mx-5 px-5" style={styles.footer}>
        <ThemedText
          className="text-right text-sm"
          style={styles.totalItemsText}
        >
          {t("order_detail.products.total_items", { count: items.length })}
        </ThemedText>
      </View>
    </BaseCard>
  );
};
