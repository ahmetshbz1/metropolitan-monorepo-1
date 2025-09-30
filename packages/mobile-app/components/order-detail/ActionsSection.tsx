//  "ActionsSection.tsx"
//  metropolitan app
//  Created by Ahmet on 28.06.2025.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BaseButton } from "@/components/base/BaseButton";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import Colors from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { FullOrderPayload, OrderItem, useOrders } from "@/context/OrderContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/useToast";

interface ActionsSectionProps {
  orderData: FullOrderPayload;
  onPressHelp: () => void;
  onDownloadInvoice?: () => void;
  onCancelOrder?: () => Promise<void>;
}

export function ActionsSection({
  orderData,
  onPressHelp,
  onDownloadInvoice,
  onCancelOrder,
}: ActionsSectionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { addToCart } = useCart();
  const router = useRouter();
  const { triggerHaptic } = useHaptics();
  const { t } = useTranslation();
  const { cancelOrder, loading } = useOrders();
  const { dialogState, showDialog, hideDialog, handleConfirm } = useConfirmationDialog();
  const { showToast } = useToast();

  const handleDownloadInvoice = () => {
    if (onDownloadInvoice) {
      onDownloadInvoice();
    } else {
      showToast(t("general.feature_soon"), "info");
    }
  };

  const handleRepeatOrder = async () => {
    orderData.items.forEach((item: OrderItem) => {
      addToCart(item.product.id, item.quantity);
    });
    triggerHaptic();
    router.push("/(tabs)/cart");
  };

  const handleCancel = () => {
    showDialog({
      title: t("order_detail.cancel_confirm_title"),
      message: t("order_detail.cancel_confirm_message"),
      icon: "close-circle-outline",
      confirmText: t("general.yes"),
      cancelText: t("general.no"),
      destructive: true,
      onConfirm: async () => {
        try {
          if (onCancelOrder) {
            await onCancelOrder();
          } else {
            await cancelOrder(orderData.order.id);
            showToast(t("order_detail.cancel_success_title"), "success");
            router.back();
          }
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ||
            t("order_detail.cancel_error_message");
          showToast(errorMessage, "error");
        }
      },
    });
  };

  const canBeCancelled = ["pending", "confirmed"].includes(
    orderData.order.status.toLowerCase()
  );
  const canDownloadInvoice = ["confirmed", "shipped", "delivered"].includes(
    orderData.order.status.toLowerCase()
  );

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <View className="flex-1">
          <BaseButton
            variant="outlined"
            size="small"
            title={t("order_detail.actions.repeat_order")}
            onPress={handleRepeatOrder}
            fullWidth
            icon={<Ionicons name="repeat" size={18} color={colors.tint} />}
          />
        </View>
        {canDownloadInvoice && (
          <View className="flex-1">
            <BaseButton
              variant="primary"
              size="small"
              title={t("order_detail.actions.download_invoice")}
              onPress={handleDownloadInvoice}
              fullWidth
              icon={<Ionicons name="download-outline" size={18} color="white" />}
            />
          </View>
        )}
      </View>
      <BaseButton
        variant="ghost"
        size="small"
        title={t("order_detail.actions.request_help")}
        onPress={onPressHelp}
        fullWidth
        icon={<Ionicons name="help-circle-outline" size={18} color={colors.mediumGray} />}
      />
      {canBeCancelled && (
        <BaseButton
          variant="primary"
          size="small"
          title={t("order_detail.cancel_order")}
          onPress={handleCancel}
          loading={loading}
          disabled={loading}
          fullWidth
          style={{ backgroundColor: "#D70040" }}
        />
      )}

      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        icon={dialogState.icon}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        destructive={dialogState.destructive}
        loading={dialogState.loading}
        onConfirm={handleConfirm}
        onCancel={hideDialog}
      />
    </View>
  );
}
