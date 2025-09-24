//  "ProductInfo.tsx"
//  metropolitan app
//  Created by Ahmet on 15.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View, TouchableOpacity, ScrollView } from "react-native";
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
    <ThemedView className="p-3 rounded-t-2xl mt-1">
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 mr-4">
          <ThemedText style={{ fontSize: 26, fontWeight: 'bold', lineHeight: 32 }}>
            {product.name}
          </ThemedText>
          <ThemedText className="text-sm mt-1" style={{ color: "#9E9E9E" }}>
            {t(`brands.${product.brand.toLowerCase()}`)}
          </ThemedText>

          <TouchableOpacity
            className="flex-row items-center self-start mt-2"
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
        <View className="items-end">
          <ThemedText style={{ fontSize: 26, fontWeight: 'bold', lineHeight: 32, color: colors.primary }}>
            {formatPrice(product.price, product.currency)}
          </ThemedText>

          {/* Quantity Selector - Fiyatın altında */}
          {product.stock > 0 && (
            <View
              className="flex-row items-center rounded-lg border overflow-hidden mt-2"
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
                className="w-9 h-9 items-center justify-center"
                onPress={() => onUpdateQuantity(-1)}
                disabled={numericQuantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={numericQuantity <= 1 ? colors.mediumGray : colors.text}
                />
              </HapticIconButton>
              <TextInput
                className="text-base font-bold text-center"
                style={{
                  color: colors.text,
                  minWidth: 40,
                  height: "100%",
                  textAlignVertical: "center",
                  paddingVertical: 0,
                  includeFontPadding: false,
                  lineHeight: 20,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: colors.borderColor,
                }}
                value={quantity}
                onChangeText={onQuantityChange}
                onBlur={onQuantityBlur}
                keyboardType="numeric"
                selectTextOnFocus
                returnKeyType="done"
                contextMenuHidden
                maxLength={3}
              />
              <HapticIconButton
                className="w-9 h-9 items-center justify-center"
                onPress={() => onUpdateQuantity(1)}
                disabled={numericQuantity >= product.stock}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={numericQuantity >= product.stock ? colors.mediumGray : colors.text}
                />
              </HapticIconButton>
            </View>
          )}
        </View>
      </View>

      {product.description && (
        <View className="mb-2 p-3 rounded-xl" style={{ backgroundColor: colors.card }}>
          <ThemedText className="text-sm leading-5" style={{ color: colors.mediumGray }}>
            {product.description.length > 120
              ? `${product.description.substring(0, 120)}...`
              : product.description}
          </ThemedText>
        </View>
      )}

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

      <CustomBottomSheet
        ref={bottomSheetRef}
        title={t("product_detail.product_details_sheet_title")}
      >
        <View className="p-4">
          {/* Genel Bilgiler */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="information-circle" size={24} color={colors.tint} />
              <ThemedText className="text-lg font-bold ml-2">
                {t("product_detail.info.general")}
              </ThemedText>
            </View>

            {product.description && (
              <View className="mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.card }}>
                <ThemedText className="text-sm font-semibold mb-1" style={{ color: colors.mediumGray }}>
                  {t("product_detail.info.description")}
                </ThemedText>
                <ThemedText className="text-sm leading-5">
                  {product.description}
                </ThemedText>
              </View>
            )}

            {product.netQuantity && (
              <View className="mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.card }}>
                <ThemedText className="text-sm font-semibold mb-1" style={{ color: colors.mediumGray }}>
                  {t("product_detail.info.net_quantity")}
                </ThemedText>
                <ThemedText className="text-sm">{product.netQuantity}</ThemedText>
              </View>
            )}

            {product.originCountry && (
              <View className="mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.card }}>
                <ThemedText className="text-sm font-semibold mb-1" style={{ color: colors.mediumGray }}>
                  {t("product_detail.info.origin_country")}
                </ThemedText>
                <ThemedText className="text-sm">{product.originCountry}</ThemedText>
              </View>
            )}

            {product.expiryDate && (
              <View className="mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.card }}>
                <ThemedText className="text-sm font-semibold mb-1" style={{ color: colors.mediumGray }}>
                  {t("product_detail.info.expiry_date")}
                </ThemedText>
                <ThemedText className="text-sm">
                  {new Date(product.expiryDate).toLocaleDateString('tr-TR')}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Alerjen Bilgileri */}
          {product.allergens && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="warning" size={24} color={colors.warning || '#FFA500'} />
                <ThemedText className="text-lg font-bold ml-2">
                  {t("product_detail.info.allergens")}
                </ThemedText>
              </View>
              <View className="p-3 rounded-lg border" style={{ backgroundColor: '#FFF5E6', borderColor: '#FFA500' }}>
                <ThemedText className="text-sm">{product.allergens}</ThemedText>
              </View>
            </View>
          )}

          {/* Besin Değerleri */}
          {product.nutritionalValues && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="nutrition" size={24} color={colors.tint} />
                <ThemedText className="text-lg font-bold ml-2">
                  {t("product_detail.info.nutritional_values")}
                </ThemedText>
              </View>
              <View className="p-3 rounded-lg" style={{ backgroundColor: colors.card }}>
                <ThemedText className="text-xs mb-2" style={{ color: colors.mediumGray }}>
                  {t("product_detail.info.per_100g")}
                </ThemedText>
                {product.nutritionalValues.energy && (
                  <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                    <ThemedText className="text-sm">{t("product_detail.info.energy")}</ThemedText>
                    <ThemedText className="text-sm font-medium">{product.nutritionalValues.energy}</ThemedText>
                  </View>
                )}
                {product.nutritionalValues.fat && (
                  <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                    <ThemedText className="text-sm">{t("product_detail.info.fat")}</ThemedText>
                    <ThemedText className="text-sm font-medium">{product.nutritionalValues.fat}</ThemedText>
                  </View>
                )}
                {product.nutritionalValues.saturatedFat && (
                  <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                    <ThemedText className="text-sm ml-4">{t("product_detail.info.saturated_fat")}</ThemedText>
                    <ThemedText className="text-sm font-medium">{product.nutritionalValues.saturatedFat}</ThemedText>
                  </View>
                )}
                {product.nutritionalValues.carbohydrates && (
                  <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                    <ThemedText className="text-sm">{t("product_detail.info.carbohydrates")}</ThemedText>
                    <ThemedText className="text-sm font-medium">{product.nutritionalValues.carbohydrates}</ThemedText>
                  </View>
                )}
                {product.nutritionalValues.sugar && (
                  <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                    <ThemedText className="text-sm ml-4">{t("product_detail.info.sugar")}</ThemedText>
                    <ThemedText className="text-sm font-medium">{product.nutritionalValues.sugar}</ThemedText>
                  </View>
                )}
                {product.nutritionalValues.protein && (
                  <View className="flex-row justify-between py-2 border-b" style={{ borderBottomColor: colors.borderColor }}>
                    <ThemedText className="text-sm">{t("product_detail.info.protein")}</ThemedText>
                    <ThemedText className="text-sm font-medium">{product.nutritionalValues.protein}</ThemedText>
                  </View>
                )}
                {product.nutritionalValues.salt && (
                  <View className="flex-row justify-between py-2" style={{ borderBottomColor: colors.borderColor }}>
                    <ThemedText className="text-sm">{t("product_detail.info.salt")}</ThemedText>
                    <ThemedText className="text-sm font-medium">{product.nutritionalValues.salt}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Saklama Koşulları */}
          {product.storageConditions && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="snow" size={24} color={colors.tint} />
                <ThemedText className="text-lg font-bold ml-2">
                  {t("product_detail.info.storage")}
                </ThemedText>
              </View>
              <View className="p-3 rounded-lg" style={{ backgroundColor: colors.card }}>
                <ThemedText className="text-sm">{product.storageConditions}</ThemedText>
              </View>
            </View>
          )}

          {/* Üretici Bilgileri */}
          {product.manufacturerInfo && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="business" size={24} color={colors.tint} />
                <ThemedText className="text-lg font-bold ml-2">
                  {t("product_detail.info.manufacturer")}
                </ThemedText>
              </View>
              <View className="p-3 rounded-lg" style={{ backgroundColor: colors.card }}>
                {product.manufacturerInfo.name && (
                  <ThemedText className="text-sm font-semibold mb-1">{product.manufacturerInfo.name}</ThemedText>
                )}
                {product.manufacturerInfo.address && (
                  <ThemedText className="text-sm" style={{ color: colors.mediumGray }}>
                    {product.manufacturerInfo.address}
                  </ThemedText>
                )}
                {product.manufacturerInfo.phone && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="call-outline" size={16} color={colors.mediumGray} />
                    <ThemedText className="text-sm ml-2" style={{ color: colors.mediumGray }}>
                      {product.manufacturerInfo.phone}
                    </ThemedText>
                  </View>
                )}
                {product.manufacturerInfo.email && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="mail-outline" size={16} color={colors.mediumGray} />
                    <ThemedText className="text-sm ml-2" style={{ color: colors.mediumGray }}>
                      {product.manufacturerInfo.email}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Alt boşluk için */}
          <View className="h-8" />
        </View>
      </CustomBottomSheet>
    </ThemedView>
  );
}