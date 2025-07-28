//  "ProductSection.tsx"
//  metropolitan app
//  Created by Ahmet on 03.07.2025. Edited on 19.07.2025.

import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { Product } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ProductCard } from "../products/ProductCard";

interface ProductSectionProps {
  title: string;
  products: Product[];
}

function ProductSectionComponent({ title, products }: ProductSectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const flatListRef = useRef<FlatList>(null);
  const currentOffsetRef = useRef(0);

  const renderItem: ListRenderItem<Product> = ({ item }) => (
    <ProductCard product={item} variant="horizontal" />
  );

  const handleScrollNext = () => {
    if (flatListRef.current) {
      // Scroll by 360 pixels (roughly 2 cards)
      const nextOffset = currentOffsetRef.current + 360;

      flatListRef.current.scrollToOffset({
        offset: nextOffset,
        animated: true,
      });

      // Update current offset
      currentOffsetRef.current = nextOffset;
    }
  };

  const handleScroll = (event: any) => {
    // Keep track of current scroll position
    currentOffsetRef.current = event.nativeEvent.contentOffset.x;
  };

  return (
    <View className="mt-6">
      {/* Title with scroll indicator */}
      <View className="flex-row items-center justify-between mb-4 px-1">
        <ThemedText type="subtitle" className="text-lg font-semibold flex-1">
          {title}
        </ThemedText>

        {/* Scroll indicator - clickable arrow */}
        <TouchableOpacity
          onPress={handleScrollNext}
          activeOpacity={0.7}
          className="flex-row items-center"
        >
          <View
            className="flex-row items-center px-2 py-1 rounded-full"
            style={{
              backgroundColor:
                colorScheme === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={
                colorScheme === "dark"
                  ? "rgba(255, 255, 255, 0.6)"
                  : colors.mediumGray
              }
            />
            <Ionicons
              name="chevron-forward"
              size={16}
              color={
                colorScheme === "dark"
                  ? "rgba(255, 255, 255, 0.4)"
                  : "rgba(0, 0, 0, 0.3)"
              }
              style={{ marginLeft: -8 }}
            />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 6 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
}

export const ProductSection = React.memo(ProductSectionComponent);
