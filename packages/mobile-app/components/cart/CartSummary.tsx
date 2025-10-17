//  "CartSummary.tsx"
//  metropolitan app
//  Created by Ahmet on 16.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { BaseButton } from "@/components/base/BaseButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { CartSummary as CartSummaryType } from "@/context/CartContext";
import { formatPrice } from "@/core/utils";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

interface CartSummaryProps {
  summary: CartSummaryType;
  onCheckout: () => void;
  isCheckingOut?: boolean;
}

export const CART_SUMMARY_HEIGHT = 120; // Increased height for mini sheet

// Hook to get dynamic cart summary height
export function useCartSummaryHeight() {
  const { paddingBottom } = useTabBarHeight();
  return CART_SUMMARY_HEIGHT + paddingBottom;
}

export function CartSummary({
  summary,
  onCheckout,
  isCheckingOut,
}: CartSummaryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();
  const { paddingBottom } = useTabBarHeight();
  const { user } = useAuth();
  const router = useRouter();

  const MINIMUM_ORDER_AMOUNT = 200;
  const isIndividual = user?.userType === "individual";
  const isBelowMinimum = isIndividual && summary.totalAmount < MINIMUM_ORDER_AMOUNT;
  const remainingAmount = MINIMUM_ORDER_AMOUNT - summary.totalAmount;

  return (
    <ThemedView
      className="absolute bottom-0 left-0 right-0 z-10"
      style={{
        paddingTop: 16,
        paddingBottom,
        paddingHorizontal: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: colors.cardBackground,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 12,
      }}
    >
      {isBelowMinimum && (
        <TouchableOpacity
          className="flex-row items-center mb-3 p-3 rounded-xl active:opacity-70"
          style={{ backgroundColor: colors.error + "15" }}
          onPress={() => router.push("/suggested-products")}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.error}
            style={{ marginRight: 8 }}
          />
          <ThemedText
            className="text-xs flex-1"
            style={{ color: colors.error }}
          >
            {t("cart.minimum_order_warning", {
              amount: formatPrice(remainingAmount, summary.currency),
            })}
          </ThemedText>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.error}
          />
        </TouchableOpacity>
      )}

      <View className="flex-row items-center justify-between mb-3">
        <ThemedText className="text-sm" style={{ color: "#666" }}>
          {t("cart.summary.total_label", { count: summary.totalItems })}
        </ThemedText>
        <ThemedText
          className="text-xl font-bold"
          style={{ color: colors.tint }}
        >
          {formatPrice(summary.totalAmount, summary.currency)}
        </ThemedText>
      </View>

      <BaseButton
        variant="primary"
        size="small"
        title={t("cart.checkout")}
        onPress={onCheckout}
        loading={isCheckingOut}
        disabled={isCheckingOut || isBelowMinimum}
        fullWidth
      />
    </ThemedView>
  );
}
