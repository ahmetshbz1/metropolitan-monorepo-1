//  "ProductList.tsx"
//  metropolitan app
//  Created by Ahmet on 30.09.2025.

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
import { Product } from "@/context/ProductContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ProductListItem } from "./ProductListItem";

interface ProductListProps {
  products?: Product[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export interface ProductListRef {
  scrollToTop: () => void;
}

export const ProductList = forwardRef<ProductListRef, ProductListProps>(
  function ProductList(
    {
      products,
      onRefresh,
      refreshing,
    },
    ref
  ) {
    const colorScheme = useColorScheme() ?? "light";
    const colors = Colors[colorScheme];
    const flatListRef = useRef<FlatList>(null);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      },
    }));

    const renderItem: ListRenderItem<Product> = useCallback(
      ({ item }) => (
        <ProductListItem product={item} />
      ),
      []
    );

    const keyExtractor = useCallback((item: Product, index: number) => {
      return `${item.id}-${index}`;
    }, []);

    return (
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 16,
        }}
        refreshControl={
          onRefresh && refreshing !== undefined ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          ) : undefined
        }
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={9}
        updateCellsBatchingPeriod={100}
        showsVerticalScrollIndicator={false}
      />
    );
  }
);