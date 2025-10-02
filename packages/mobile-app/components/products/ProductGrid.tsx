//  "ProductGrid.tsx"
//  metropolitan app
//  Created by Ahmet on 04.06.2025. Edited on 19.07.2025.

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
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentContainerStyle?: object;
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

    // Horizontal scroll için card width, vertical için numColumns
    const numColumns = horizontal ? undefined : (isTablet ? 4 : 3);
    const gap = horizontal ? (isTablet ? 10 : 6) : (isTablet ? 10 : 5);
    const horizontalPadding = horizontal ? (isTablet ? 12 : 10) : (isTablet ? 12 : 6);

    // Kart genişliği hesaplama - hem horizontal hem vertical için
    const calculateCardWidth = () => {
      if (cardWidth) return cardWidth; // Prop olarak gelirse onu kullan
      if (horizontal) return isTablet ? 180 : 110; // Yatay scroll
      // Dikey grid için hesapla
      const cols = numColumns || 3;
      return (width - (horizontalPadding * 2) - (gap * (cols - 1))) / cols;
    };

    const finalCardWidth = calculateCardWidth();

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      },
    }));

    const products = propProducts || contextProducts;

    const onEndReached = propProducts ? undefined : undefined;

    const renderItem: ListRenderItem<Product> = useCallback(
      ({ item }) => (
        <View style={{ width: finalCardWidth }}>
          <ProductCard product={item} replaceNavigation={replaceNavigation} />
        </View>
      ),
      [finalCardWidth, replaceNavigation]
    );

    const renderFooter = useCallback(() => {
      if (!loadingProducts || propProducts) return null;
      return <ActivityIndicator style={{ marginVertical: 20 }} />;
    }, [loadingProducts, propProducts]);

    const keyExtractor = useCallback((item: Product, index: number) => {
      return `${item.id}-${index}`;
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
        contentContainerStyle={[
          { paddingHorizontal: horizontalPadding, paddingVertical: horizontal ? 0 : 8, gap },
          contentContainerStyle,
        ]}
        columnWrapperStyle={horizontal ? undefined : { gap }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
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
        // Basic performance optimizations - removeClippedSubviews disable (resim yükleme sorunları için)
        removeClippedSubviews={false}
        maxToRenderPerBatch={horizontal ? 12 : 10}
        windowSize={horizontal ? 8 : 10}
        initialNumToRender={horizontal ? 12 : (numColumns ? numColumns * 3 : 9)}
        updateCellsBatchingPeriod={horizontal ? 50 : 100}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    );
  }
);
