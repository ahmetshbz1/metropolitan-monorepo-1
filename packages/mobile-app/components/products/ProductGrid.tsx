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

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      },
    }));

    const products = propProducts || contextProducts;

    const onEndReached = propProducts ? undefined : undefined;

    const renderItem: ListRenderItem<Product> = useCallback(
      ({ item }) => (
        <ProductCard product={item} />
      ),
      []
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
        numColumns={3}
        contentContainerStyle={[
          { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
          contentContainerStyle,
        ]}
        columnWrapperStyle={{ gap: 8 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        refreshControl={
          onRefresh && refreshing !== undefined ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          ) : undefined
        }
        // Basic performance optimizations - sadece temel olanlar
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={9}
        updateCellsBatchingPeriod={100}
        showsVerticalScrollIndicator={false}
      />
    );
  }
);
