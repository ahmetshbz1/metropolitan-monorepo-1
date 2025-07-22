//  "ProductItem.tsx"
//  metropolitan app
//  Created by Ahmet on 05.07.2025.

import { ThemedText } from "@/components/ThemedText";
import { OrderItem } from "@/context/OrderContext";
import { formatPrice } from "@/core/utils";
import { createProductsSectionStyles } from "@/utils/productsSectionStyles";
import { Image } from "expo-image";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface ProductItemProps {
  item: OrderItem;
  currency?: string;
  onPress: (productId: string) => void;
  getProductImage: (productId: string) => string | undefined;
  showDivider: boolean;
  colors: any;
  t: (key: string, options?: any) => string;
}

export const ProductItem: React.FC<ProductItemProps> = ({
  item,
  currency,
  onPress,
  getProductImage,
  showDivider,
  colors,
  t,
}) => {
  const styles = createProductsSectionStyles(colors);

  return (
    <React.Fragment>
      <TouchableOpacity
        className="flex-row items-center py-2.5 px-0"
        onPress={() => onPress(item.product.id)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: getProductImage(item.product.id) }}
          style={styles.productImage}
          contentFit="contain"
        />
        <View className="flex-1 justify-center">
          <ThemedText className="text-base font-medium" numberOfLines={2}>
            {item.product.name}
          </ThemedText>
          <ThemedText className="text-sm mt-1" style={styles.quantityText}>
            {t("order_detail.products.quantity", { count: item.quantity })}
          </ThemedText>
        </View>
        <View className="pl-2.5 items-end">
          <ThemedText className="text-base font-semibold">
            {formatPrice(item.unitPrice, currency)}
          </ThemedText>
        </View>
      </TouchableOpacity>
      {showDivider && <View className="ml-20" style={styles.divider} />}
    </React.Fragment>
  );
};
