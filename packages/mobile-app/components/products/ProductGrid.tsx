//  "ProductGrid.tsx"
//  metropolitan app
//  Modern, performanslı ürün grid

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  RefreshControl,
  useWindowDimensions,
  View,
} from "react-native";

import Colors from "@/constants/Colors";
import { Product, useProducts } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products?: Product[];
  ListHeaderComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentContainerStyle?: Record<string, unknown>;
  horizontal?: boolean;
  scrollEnabled?: boolean;
  cardWidth?: number;
  replaceNavigation?: boolean;
}

export interface ProductGridRef {
  scrollToTop: () => void;
}

export const ProductGrid = forwardRef<ProductGridRef, ProductGridProps>(
  function ProductGrid(
    {
      products: propProducts,
      ListHeaderComponent,
      onRefresh,
      refreshing,
      contentContainerStyle,
      horizontal = false,
      scrollEnabled = true,
      cardWidth,
      replaceNavigation = false,
    },
    ref
  ) {
    const {
      products: contextProducts,
      loadingProducts,
    } = useProducts();

    const colorScheme = useColorScheme() ?? "light";
    const colors = Colors[colorScheme];
    const flatListRef = useRef<FlatList>(null);
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    // Grid yapılandırması
    const numColumns = horizontal ? undefined : (isTablet ? 4 : 3);
    const gap = horizontal ? (isTablet ? 12 : 8) : (isTablet ? 12 : 8);
    const horizontalPadding = horizontal ? (isTablet ? 16 : 12) : (isTablet ? 12 : 8);

    // Kart genişliği hesaplama
    const calculateCardWidth = useCallback(() => {
      if (cardWidth) return cardWidth;
      if (horizontal) return isTablet ? 200 : 140;
      const cols = numColumns || 2;
      return (width - (horizontalPadding * 2) - (gap * (cols - 1))) / cols;
    }, [cardWidth, horizontal, isTablet, numColumns, width, horizontalPadding, gap]);

    const finalCardWidth = calculateCardWidth();

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      },
    }));

    const products = propProducts || contextProducts;

    const renderItem: ListRenderItem<Product> = useCallback(
      ({ item, index }) => {
        return (
          <View style={{ width: finalCardWidth, marginBottom: horizontal ? 0 : gap }}>
            <ProductCard
              product={item}
              replaceNavigation={replaceNavigation}
              index={index}
            />
          </View>
        );
      },
      [finalCardWidth, replaceNavigation, horizontal, gap]
    );

    const renderFooter = useCallback(() => {
      if (!loadingProducts || propProducts) return null;
      return (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={colors.tint} />
        </View>
      );
    }, [loadingProducts, propProducts, colors.tint]);

    const keyExtractor = useCallback((item: Product, index: number) => {
      return `product-${item.id}-${index}`;
    }, []);

    return (
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        key={horizontal ? 'horizontal-list' : `product-grid-${numColumns}`}
        horizontal={horizontal}
        numColumns={horizontal ? undefined : numColumns}
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled={true}
        contentContainerStyle={[
          {
            paddingHorizontal: horizontalPadding,
            paddingVertical: horizontal ? 8 : 12,
          },
          contentContainerStyle,
        ]}
        columnWrapperStyle={horizontal ? undefined : { gap }}
        ItemSeparatorComponent={horizontal ? () => <View style={{ width: gap }} /> : undefined}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        refreshControl={
          onRefresh && refreshing !== undefined && !horizontal ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          ) : undefined
        }
        // Performans optimizasyonları
        removeClippedSubviews={false}
        maxToRenderPerBatch={horizontal ? 6 : 10}
        windowSize={21}
        initialNumToRender={horizontal ? 6 : 10}
        updateCellsBatchingPeriod={100}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    );
  }
);
