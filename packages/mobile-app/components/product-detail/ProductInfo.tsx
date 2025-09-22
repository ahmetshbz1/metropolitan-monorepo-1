//  "ProductInfo.tsx"
//  metropolitan app
//  Created by Ahmet on 15.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View, TouchableOpacity } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { HapticIconButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CustomBottomSheet from "@/components/CustomBottomSheet";
import Colors from "@/constants/Colors";
import { formatPrice } from "@/core/utils";
import { useColorScheme } from "@/hooks/useColorScheme";
import type { Product } from "@metropolitan/shared";

interface ProductInfoProps {
  product: Product | null;
  quantity: string;
  onQuantityChange: (text: string) => void;
  onQuantityBlur: () => void;
  onUpdateQuantity: (amount: number) => void;
}

export function ProductInfo({
  product,
  quantity,
  onQuantityChange,
  onQuantityBlur,
  onUpdateQuantity,
}: ProductInfoProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const numericQuantity = parseInt(quantity, 10) || 0;

  if (!product) {
    return null; // or a loading indicator
  }

  return (
    <ThemedView className="p-5 rounded-t-2xl -mt-5">
      <View className="flex-row justify-between items-center mb-4">
        <ThemedText className="text-2xl font-bold leading-8">
          {product.name}
        </ThemedText>
        <ThemedText className="text-3xl font-bold leading-9">
          {formatPrice(product.price, product.currency)}
        </ThemedText>
      </View>

      <View className="mb-4">
        <ThemedText className="text-sm mb-3" style={{ color: "#9E9E9E" }}>
          {t(`brands.${product.brand.toLowerCase()}`)}
        </ThemedText>

        {product.description && (
          <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.card }}>
            <ThemedText className="text-sm leading-5" style={{ color: colors.mediumGray }}>
              {product.description.length > 120
                ? `${product.description.substring(0, 120)}...`
                : product.description}
            </ThemedText>
          </View>
        )}

        <TouchableOpacity
          className="flex-row items-center self-start"
          onPress={() => {
            bottomSheetRef.current?.present();
          }}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
          <ThemedText className="text-sm ml-1.5 font-medium" style={{ color: colors.tint }}>
            {t("product_detail.product_details")}
          </ThemedText>
          <Ionicons name="chevron-forward" size={16} color={colors.tint} className="ml-1" />
        </TouchableOpacity>
      </View>

      {product.stock < 10 && product.stock > 0 && (
        <View className="flex-row items-center mb-2.5">
          <Ionicons name="cube-outline" size={20} color={colors.text} />
          <ThemedText className="text-sm leading-6 ml-2">
            {t("product_detail.stock_available", { count: product.stock })}
          </ThemedText>
        </View>
      )}

      {product.stock === 0 && (
        <View className="flex-row items-center mb-2.5">
          <Ionicons name="cube-outline" size={20} color={colors.text} />
          <ThemedText className="text-sm leading-6 ml-2">
            {t("product_detail.out_of_stock")}
          </ThemedText>
        </View>
      )}

      {/* Quantity Selector */}
      {product.stock > 0 && (
        <View className="mt-4">
          <ThemedText
            className="text-sm font-medium mb-2"
            style={{ color: colors.text }}
          >
Miktar
          </ThemedText>
          <View
            className="flex-row items-center rounded-2xl border-2 overflow-hidden self-start"
            style={{
              borderColor: colors.borderColor,
              backgroundColor: colors.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <HapticIconButton
              className="w-12 h-12 items-center justify-center"
              onPress={() => onUpdateQuantity(-1)}
              hapticType="light"
              disabled={numericQuantity <= 1}
            >
              <Ionicons
                name="remove"
                size={20}
                color={numericQuantity <= 1 ? colors.mediumGray : colors.text}
              />
            </HapticIconButton>
            <TextInput
              className="text-lg font-bold text-center"
              style={{
                color: colors.text,
                minWidth: 50,
                height: "100%",
                textAlignVertical: "center",
                paddingVertical: 0,
                includeFontPadding: false,
                lineHeight: 20,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: colors.borderColor,
                backgroundColor: colors.card,
              }}
              value={quantity}
              onChangeText={onQuantityChange}
              onBlur={onQuantityBlur}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />
            <HapticIconButton
              className="w-12 h-12 items-center justify-center"
              onPress={() => onUpdateQuantity(1)}
              hapticType="light"
              disabled={numericQuantity >= product.stock}
            >
              <Ionicons
                name="add"
                size={20}
                color={
                  numericQuantity >= product.stock
                    ? colors.mediumGray
                    : colors.text
                }
              />
            </HapticIconButton>
          </View>
        </View>
      )}

      <CustomBottomSheet
        ref={bottomSheetRef}
        title={t("product_detail.product_details_sheet_title")}
      >
        <View className="p-4">
          <ThemedText className="text-base leading-6">
            {product.description || "Bu ürün için henüz detaylı açıklama bulunmamaktadır."}
          </ThemedText>

          <View className="mt-6">
            <ThemedText className="text-lg font-semibold mb-3">
              Ürün Özellikleri
            </ThemedText>

            <View className="space-y-3">
              <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                <ThemedText className="text-sm" style={{ color: colors.mediumGray }}>Marka</ThemedText>
                <ThemedText className="text-sm font-medium">{t(`brands.${product.brand.toLowerCase()}`)}</ThemedText>
              </View>

              <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                <ThemedText className="text-sm" style={{ color: colors.mediumGray }}>Kategori</ThemedText>
                <ThemedText className="text-sm font-medium">{product.category}</ThemedText>
              </View>

              <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                <ThemedText className="text-sm" style={{ color: colors.mediumGray }}>Fiyat</ThemedText>
                <ThemedText className="text-sm font-medium">{formatPrice(product.price, product.currency)}</ThemedText>
              </View>

              <View className="flex-row justify-between py-2">
                <ThemedText className="text-sm" style={{ color: colors.mediumGray }}>Stok Durumu</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {product.stock > 0 ? `${product.stock} adet` : "Stokta yok"}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </CustomBottomSheet>
    </ThemedView>
  );
}
