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
      filteredProducts,
      searchQuery,
      fetchMoreProducts,
      // hasMoreProducts,
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

    // Prop olarak products verilmişse onu kullan, yoksa context'ten al
    // Arama aktifse filteredProducts kullan
    const products =
      propProducts || (searchQuery.trim() ? filteredProducts : contextProducts);

    // Arama aktifse infinite scroll'u devre dışı bırak
    const onEndReached =
      propProducts || searchQuery.trim() ? undefined : fetchMoreProducts;

    const renderItem: ListRenderItem<Product> = useCallback(
      ({ item }) => (
        <ProductCard product={item} />
      ),
      []
    );

    const renderFooter = useCallback(() => {
      // Arama aktifse veya external products kullanılıyorsa footer gösterme
      if (!loadingProducts || searchQuery.trim() || propProducts) return null;
      return <ActivityIndicator style={{ marginVertical: 20 }} />;
    }, [loadingProducts, searchQuery, propProducts]);

    const keyExtractor = useCallback((item: Product, index: number) => {
      return `${item.id}-${index}`;
    }, []);

    return (
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={[
          { paddingHorizontal: 8, paddingVertical: 8 },
          contentContainerStyle,
        ]}
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
        initialNumToRender={6}
        updateCellsBatchingPeriod={100}
        showsVerticalScrollIndicator={false}
      />
    );
  }
);
