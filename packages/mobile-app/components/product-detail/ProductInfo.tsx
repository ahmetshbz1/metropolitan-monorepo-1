//  "ProductInfo.tsx"
//  metropolitan app
//  Created by Ahmet on 15.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState, memo, useMemo } from "react";
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

// Memo optimized component
export const ProductInfo = memo<ProductInfoProps>(function ProductInfo({
  product,
  quantity,
  onQuantityChange,
  onQuantityBlur,
  onUpdateQuantity,
}) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Memoize numeric quantity calculation
  const numericQuantity = useMemo(() => parseInt(quantity, 10) || 0, [quantity]);

  if (!product) {
    return null;
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
          {/* Sertifika Badge'leri */}
          {product.badges && Object.values(product.badges).some(v => v) && (
            <View className="mb-5">
              <View className="flex-row flex-wrap gap-2">
                {product.badges.halal && (
                  <View className="flex-row items-center px-3 py-2 rounded-full" style={{ backgroundColor: '#00A86B20' }}>
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#00A86B' }} />
                    <ThemedText className="text-xs font-semibold" style={{ color: '#00A86B' }}>
                      Helal
                    </ThemedText>
                  </View>
                )}
                {product.badges.vegetarian && (
                  <View className="flex-row items-center px-3 py-2 rounded-full" style={{ backgroundColor: '#32CD3220' }}>
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#32CD32' }} />
                    <ThemedText className="text-xs font-semibold" style={{ color: '#32CD32' }}>
                      Vejetaryan
                    </ThemedText>
                  </View>
                )}
                {product.badges.vegan && (
                  <View className="flex-row items-center px-3 py-2 rounded-full" style={{ backgroundColor: '#228B2220' }}>
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#228B22' }} />
                    <ThemedText className="text-xs font-semibold" style={{ color: '#228B22' }}>
                      Vegan
                    </ThemedText>
                  </View>
                )}
                {product.badges.glutenFree && (
                  <View className="flex-row items-center px-3 py-2 rounded-full" style={{ backgroundColor: '#FFB52E20' }}>
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#FFB52E' }} />
                    <ThemedText className="text-xs font-semibold" style={{ color: '#FFB52E' }}>
                      Glutensiz
                    </ThemedText>
                  </View>
                )}
                {product.badges.organic && (
                  <View className="flex-row items-center px-3 py-2 rounded-full" style={{ backgroundColor: '#8B451320' }}>
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#8B4513' }} />
                    <ThemedText className="text-xs font-semibold" style={{ color: '#8B4513' }}>
                      Organik
                    </ThemedText>
                  </View>
                )}
                {product.badges.lactoseFree && (
                  <View className="flex-row items-center px-3 py-2 rounded-full" style={{ backgroundColor: '#6495ED20' }}>
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#6495ED' }} />
                    <ThemedText className="text-xs font-semibold" style={{ color: '#6495ED' }}>
                      Laktozsuz
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Genel Bilgiler Tablosu */}
          <View className="mb-5 rounded-xl overflow-hidden" style={{ backgroundColor: colors.card }}>
            <View className="flex-row items-center px-4 py-3" style={{ backgroundColor: colors.tint + '15' }}>
              <Ionicons name="information-circle" size={20} color={colors.tint} />
              <ThemedText className="text-base font-bold ml-2">
                {t("product_detail.info.general")}
              </ThemedText>
            </View>

            {product.description && (
              <>
                <View className="flex-row px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                  <ThemedText className="text-sm" style={{ color: colors.mediumGray, width: 100 }}>
                    {t("product_detail.info.description")}
                  </ThemedText>
                  <ThemedText className="text-sm flex-1 ml-3">
                    {product.description}
                  </ThemedText>
                </View>
              </>
            )}

            {product.netQuantity && (
              <View className="flex-row px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                <ThemedText className="text-sm" style={{ color: colors.mediumGray, width: 100 }}>
                  {t("product_detail.info.net_quantity")}
                </ThemedText>
                <ThemedText className="text-sm font-semibold flex-1 ml-3">
                  {product.netQuantity}
                </ThemedText>
              </View>
            )}

            {product.originCountry && (
              <View className="flex-row px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                <ThemedText className="text-sm" style={{ color: colors.mediumGray, width: 100 }}>
                  {t("product_detail.info.origin_country")}
                </ThemedText>
                <ThemedText className="text-sm font-semibold flex-1 ml-3">
                  {product.originCountry}
                </ThemedText>
              </View>
            )}

            {product.expiryDate && (
              <View className="flex-row px-4 py-3">
                <ThemedText className="text-sm" style={{ color: colors.mediumGray, width: 100 }}>
                  {t("product_detail.info.expiry_date")}
                </ThemedText>
                <ThemedText className="text-sm font-semibold flex-1 ml-3">
                  {new Date(product.expiryDate).toLocaleDateString('tr-TR')}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Alerjen Bilgileri */}
          {product.allergens && (
            <View className="mb-5 rounded-xl overflow-hidden" style={{ backgroundColor: '#FFF5E6', borderWidth: 1, borderColor: '#FFA500' }}>
              <View className="flex-row items-center px-4 py-3" style={{ backgroundColor: '#FFA50025' }}>
                <Ionicons name="warning" size={20} color="#FFA500" />
                <ThemedText className="text-base font-bold ml-2" style={{ color: '#333333' }}>
                  {t("product_detail.info.allergens")}
                </ThemedText>
              </View>
              <View className="px-4 py-3">
                <ThemedText className="text-sm" style={{ color: '#333333' }}>{product.allergens}</ThemedText>
              </View>
            </View>
          )}

          {/* Besin Değerleri Tablosu */}
          {product.nutritionalValues && (
            <View className="mb-5 rounded-xl overflow-hidden" style={{ backgroundColor: colors.card }}>
              <View className="flex-row items-center px-4 py-3" style={{ backgroundColor: colors.tint + '15' }}>
                <Ionicons name="nutrition" size={20} color={colors.tint} />
                <ThemedText className="text-base font-bold ml-2">
                  {t("product_detail.info.nutritional_values")}
                </ThemedText>
                <ThemedText className="text-xs ml-auto" style={{ color: colors.mediumGray }}>
                  {t("product_detail.info.per_100g")}
                </ThemedText>
              </View>

              {product.nutritionalValues.energy && (
                <View className="flex-row justify-between px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                  <ThemedText className="text-sm">{t("product_detail.info.energy")}</ThemedText>
                  <ThemedText className="text-sm font-bold">{product.nutritionalValues.energy}</ThemedText>
                </View>
              )}
              {product.nutritionalValues.fat && (
                <View className="flex-row justify-between px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                  <ThemedText className="text-sm">{t("product_detail.info.fat")}</ThemedText>
                  <ThemedText className="text-sm font-semibold">{product.nutritionalValues.fat}</ThemedText>
                </View>
              )}
              {product.nutritionalValues.saturatedFat && (
                <View className="flex-row justify-between px-4 py-2.5 pl-8" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor, backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : colors.background }}>
                  <ThemedText className="text-xs" style={{ color: colors.mediumGray }}>{t("product_detail.info.saturated_fat")}</ThemedText>
                  <ThemedText className="text-xs">{product.nutritionalValues.saturatedFat}</ThemedText>
                </View>
              )}
              {product.nutritionalValues.carbohydrates && (
                <View className="flex-row justify-between px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                  <ThemedText className="text-sm">{t("product_detail.info.carbohydrates")}</ThemedText>
                  <ThemedText className="text-sm font-semibold">{product.nutritionalValues.carbohydrates}</ThemedText>
                </View>
              )}
              {product.nutritionalValues.sugar && (
                <View className="flex-row justify-between px-4 py-2.5 pl-8" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor, backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : colors.background }}>
                  <ThemedText className="text-xs" style={{ color: colors.mediumGray }}>{t("product_detail.info.sugar")}</ThemedText>
                  <ThemedText className="text-xs">{product.nutritionalValues.sugar}</ThemedText>
                </View>
              )}
              {product.nutritionalValues.protein && (
                <View className="flex-row justify-between px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                  <ThemedText className="text-sm">{t("product_detail.info.protein")}</ThemedText>
                  <ThemedText className="text-sm font-semibold">{product.nutritionalValues.protein}</ThemedText>
                </View>
              )}
              {product.nutritionalValues.salt && (
                <View className="flex-row justify-between px-4 py-3">
                  <ThemedText className="text-sm">{t("product_detail.info.salt")}</ThemedText>
                  <ThemedText className="text-sm font-semibold">{product.nutritionalValues.salt}</ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Saklama Koşulları */}
          {product.storageConditions && (
            <View className="mb-5 rounded-xl overflow-hidden" style={{ backgroundColor: colors.card }}>
              <View className="flex-row items-center px-4 py-3" style={{ backgroundColor: colors.tint + '15' }}>
                <Ionicons name="snow" size={20} color={colors.tint} />
                <ThemedText className="text-base font-bold ml-2">
                  {t("product_detail.info.storage")}
                </ThemedText>
              </View>
              <View className="px-4 py-3">
                <ThemedText className="text-sm leading-5">{product.storageConditions}</ThemedText>
              </View>
            </View>
          )}

          {/* Üretici Bilgileri Tablosu */}
          {product.manufacturerInfo && (
            <View className="mb-5 rounded-xl overflow-hidden" style={{ backgroundColor: colors.card }}>
              <View className="flex-row items-center px-4 py-3" style={{ backgroundColor: colors.tint + '15' }}>
                <Ionicons name="business" size={20} color={colors.tint} />
                <ThemedText className="text-base font-bold ml-2">
                  {t("product_detail.info.manufacturer")}
                </ThemedText>
              </View>

              {product.manufacturerInfo.name && (
                <View className="px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                  <ThemedText className="text-xs mb-1" style={{ color: colors.mediumGray }}>Firma Adı</ThemedText>
                  <ThemedText className="text-sm font-semibold">{product.manufacturerInfo.name}</ThemedText>
                </View>
              )}

              {product.manufacturerInfo.address && (
                <View className="px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
                  <ThemedText className="text-xs mb-1" style={{ color: colors.mediumGray }}>Adres</ThemedText>
                  <ThemedText className="text-sm">{product.manufacturerInfo.address}</ThemedText>
                </View>
              )}

              <View className="flex-row">
                {product.manufacturerInfo.phone && (
                  <View className="flex-1 px-4 py-3" style={{ borderRightWidth: 0.5, borderRightColor: colors.borderColor }}>
                    <ThemedText className="text-xs mb-1" style={{ color: colors.mediumGray }}>Telefon</ThemedText>
                    <View className="flex-row items-center">
                      <Ionicons name="call-outline" size={14} color={colors.tint} />
                      <ThemedText className="text-sm ml-1.5" style={{ color: colors.tint }}>
                        {product.manufacturerInfo.phone}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {product.manufacturerInfo.email && (
                  <View className="flex-1 px-4 py-3">
                    <ThemedText className="text-xs mb-1" style={{ color: colors.mediumGray }}>E-posta</ThemedText>
                    <View className="flex-row items-center">
                      <Ionicons name="mail-outline" size={14} color={colors.tint} />
                      <ThemedText className="text-sm ml-1.5" style={{ color: colors.tint }}>
                        {product.manufacturerInfo.email}
                      </ThemedText>
                    </View>
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
}, (prevProps, nextProps) => {
  // Optimize memo comparison - shallow comparison for props
  return (
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.product?.stock === nextProps.product?.stock &&
    prevProps.product?.price === nextProps.product?.price &&
    prevProps.quantity === nextProps.quantity
  );
});