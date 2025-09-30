//  "MinimumQuantityDialog.tsx"
//  metropolitan app

import React, { useEffect, useRef } from "react";
import { Modal, View, ActivityIndicator, Animated } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { HapticButton } from "@/components/HapticButton";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BlurView } from "expo-blur";

interface MinimumQuantityDialogProps {
  visible: boolean;
  minQuantity: number;
  productName: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MinimumQuantityDialog: React.FC<MinimumQuantityDialogProps> = ({
  visible,
  minQuantity,
  productName,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { colors, colorScheme } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <BlurView
        intensity={colorScheme === "dark" ? 80 : 60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        className="flex-1 justify-center items-center px-6"
      >
        <Animated.View
          className="w-full max-w-sm rounded-2xl p-6"
          style={{
            backgroundColor: colors.cardBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.tint}15` }}
            >
              <Ionicons name="cart-outline" size={32} color={colors.tint} />
            </View>

            <ThemedText className="text-xl font-bold text-center mb-2">
              {t("product_card.minimum_quantity_dialog.title")}
            </ThemedText>

            <ThemedText className="text-center opacity-70 mb-1">
              {productName}
            </ThemedText>

            <ThemedText className="text-center opacity-60 text-sm">
              {t("errors.MIN_QUANTITY_NOT_MET", { minQuantity })}
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <HapticButton
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl border items-center justify-center"
              style={{
                borderColor: colors.border,
                opacity: loading ? 0.5 : 1,
              }}
            >
              <ThemedText className="font-semibold">
                {t("common.cancel")}
              </ThemedText>
            </HapticButton>

            <HapticButton
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl items-center justify-center"
              style={{
                backgroundColor: colors.tint,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText className="font-semibold" style={{ color: "#fff" }}>
                  {t("product_detail.purchase.add_min_quantity", { count: minQuantity })}
                </ThemedText>
              )}
            </HapticButton>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};
