//  "ProductGrid.tsx"
//  metropolitan app
//  Created by Ahmet on 04.06.2025. Edited on 19.07.2025.

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  RefreshControl,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";

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

    // Görünür item'ları track et (performance için)
    const [viewableItems, setViewableItems] = useState<Set<string>>(new Set());
    const viewableItemsRef = useRef<Set<string>>(new Set());

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

    // Image prefetching - İlk 30 ürünün fotoğraflarını önceden yükle
    useEffect(() => {
      const prefetchImages = async () => {
        const imagesToPrefetch = products.slice(0, 30).map((product) => {
          const imageUrl = product.image;
          if (!imageUrl) return null;

          // Tam URL oluştur
          let fullUrl = imageUrl;
          if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
            const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.metropolitanfg.pl";
            fullUrl = `${baseUrl}${path}`;
          }

          return fullUrl;
        }).filter((url): url is string => url !== null);

        // Prefetch işlemi arka planda çalışır
        try {
          await Promise.all(
            imagesToPrefetch.map((url) =>
              Image.prefetch(url, { cachePolicy: "memory-disk" })
            )
          );
        } catch (error) {
          // Prefetch hataları sessizce yutulur - UX'i etkilemez
        }
      };

      if (products.length > 0) {
        prefetchImages();
      }
    }, [products]);

    // ViewabilityConfig - hangi item'lar görünür
    const onViewableItemsChanged = useCallback(
      ({ viewableItems: items }: { viewableItems: ViewToken[] }) => {
        const newViewableSet = new Set(
          items.map((item) => `product-${item.item.id}`)
        );
        viewableItemsRef.current = newViewableSet;
        setViewableItems(newViewableSet);
      },
      []
    );

    const viewabilityConfig = useRef({
      itemVisiblePercentThreshold: 10, // %10'u göründüğünde yükle
      minimumViewTime: 50, // Minimum 50ms görünür kalmalı
    }).current;

    const renderItem: ListRenderItem<Product> = useCallback(
      ({ item, index }) => {
        const itemKey = `product-${item.id}`;
        const isVisible = viewableItemsRef.current.has(itemKey);

        return (
          <View style={{ width: finalCardWidth }}>
            <ProductCard
              product={item}
              replaceNavigation={replaceNavigation}
              index={index}
              isVisible={isVisible}
            />
          </View>
        );
      },
      [finalCardWidth, replaceNavigation]
    );

    const renderFooter = useCallback(() => {
      if (!loadingProducts || propProducts) return null;
      return <ActivityIndicator style={{ marginVertical: 20 }} />;
    }, [loadingProducts, propProducts]);

    const keyExtractor = useCallback((item: Product, index: number) => {
      return `product-${item.id}-${index}`;
    }, []);

    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: horizontal ? finalCardWidth : finalCardWidth,
        offset: horizontal ? (finalCardWidth + gap) * index : 0,
        index,
      }),
      [finalCardWidth, gap, horizontal]
    );

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
        // Performance optimizations - Tüm resimler yüklenir
        removeClippedSubviews={false}
        getItemLayout={horizontal ? getItemLayout : undefined}
        maxToRenderPerBatch={horizontal ? 10 : 20}
        windowSize={horizontal ? 5 : 21}
        initialNumToRender={horizontal ? 10 : 30}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // ViewabilityConfig ile görünürlük tracking
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    );
  }
);
