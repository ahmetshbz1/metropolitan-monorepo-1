//  "ActionsSection.tsx"
//  metropolitan app
//  Created by Ahmet on 28.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";

import { HapticButton } from "@/components/HapticButton";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { FullOrderPayload, OrderItem, useOrders } from "@/context/OrderContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

interface ActionsSectionProps {
  orderData: FullOrderPayload;
  onPressHelp: () => void;
}

export function ActionsSection({
  orderData,
  onPressHelp,
}: ActionsSectionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { addToCart } = useCart();
  const router = useRouter();
  const { triggerHaptic } = useHaptics();
  const { t } = useTranslation();
  const { cancelOrder, loading } = useOrders();

  const handleDownloadInvoice = () => {
    Alert.alert(t("general.under_construction"), t("general.feature_soon"));
  };

  const handleRepeatOrder = () => {
    orderData.items.forEach((item: OrderItem) => {
      addToCart(item.product.id, item.quantity);
    });
    triggerHaptic("success");
    router.push("/(tabs)/cart");
  };

  const handleCancel = () => {
    Alert.alert(
      t("order_detail.cancel_confirm_title"),
      t("order_detail.cancel_confirm_message"),
      [
        { text: t("general.no"), style: "cancel" },
        {
          text: t("general.yes"),
          style: "destructive",
          onPress: async () => {
            try {
              await cancelOrder(orderData.order.id);
              Alert.alert(t("order_detail.cancel_success_title"));
              router.back();
            } catch (error: any) {
              const errorMessage =
                error.response?.data?.message ||
                t("order_detail.cancel_error_message");
              Alert.alert(t("order_detail.cancel_error_title"), errorMessage);
            }
          },
        },
      ]
    );
  };

  const canBeCancelled = ["pending", "confirmed"].includes(
    orderData.order.status
  );

  return (
    <View className="flex-row gap-2.5">
      <HapticButton
        onPress={handleRepeatOrder}
        className="flex-1 flex-row items-center justify-center p-3 rounded-lg"
        style={{
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.tint,
        }}
      >
        <Ionicons name="repeat" size={20} color={colors.tint} />
        <Text
          className="text-sm font-semibold ml-2.5"
          style={{ color: colors.tint }}
        >
          {t("order_detail.actions.repeat_order")}
        </Text>
      </HapticButton>
      <HapticButton
        onPress={handleDownloadInvoice}
        className="flex-1 flex-row items-center justify-center p-3 rounded-lg"
        style={{ backgroundColor: colors.tint }}
      >
        <Ionicons name="download-outline" size={20} color={"white"} />
        <Text
          className="text-sm font-semibold ml-2.5"
          style={{ color: "white" }}
        >
          {t("order_detail.actions.download_invoice")}
        </Text>
      </HapticButton>
      <HapticButton
        onPress={onPressHelp}
        className="flex-row items-center justify-center p-3 rounded-lg mt-2.5"
        style={{ backgroundColor: colors.background }}
      >
        <Ionicons
          name="help-circle-outline"
          size={20}
          color={colors.darkGray}
        />
        <Text
          className="text-sm font-medium ml-2.5"
          style={{ color: colors.darkGray }}
        >
          {t("order_detail.actions.request_help")}
        </Text>
      </HapticButton>
      {canBeCancelled && (
        <HapticButton
          title={t("order_detail.cancel_order")}
          onPress={handleCancel}
          isLoading={loading}
          disabled={loading}
          hapticType="warning"
          style={{ backgroundColor: "#D70040" }}
        />
      )}
    </View>
  );
}
