//  "[id].tsx"
//  metropolitan app
//  Created by Ahmet on 20.06.2025. Edited on 21.07.2025.

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ThemedView";
import { BaseButton } from "@/components/base/BaseButton";
import { DeliveryAndPaymentSection } from "@/components/order-detail/DeliveryAndPaymentSection";
import { OrderInfoSection } from "@/components/order-detail/OrderInfoSection";
import { ProductsSection } from "@/components/order-detail/ProductsSection";
import { SummarySection } from "@/components/order-detail/SummarySection";
import { TrackingSection } from "@/components/order-detail/TrackingSection";
import { HelpModal } from "@/components/order-detail/modal/HelpModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { OrderDetailSkeleton } from "@/components/ui/ShimmerView";
import Colors from "@/constants/Colors";
import { useOrders } from "@/context/OrderContext";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const safeAreaInsets = useSafeAreaInsets();

  const {
    selectedOrder,
    loadingDetail,
    fetchOrderById,
    error,
    cancelOrder,
    loading,
  } = useOrders();

  const helpModalRef = useRef<BottomSheetModal>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // Dinamik header title ayarlama
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("order_detail.header.title"),
    });
  }, [navigation, t]);

  useEffect(() => {
    if (id) {
      setContentReady(false);
      fetchOrderById(id, true); // Always get fresh data when navigating to order detail
    }
  }, [id]); // Remove fetchOrderById from dependencies to prevent infinite loop

  // Content ready check
  useEffect(() => {
    if (selectedOrder && !loadingDetail) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [selectedOrder, loadingDetail]);

  const downloadInvoice = () => {
    if (!selectedOrder || !id) return;

    // Fatura önizleme sayfasına yönlendir
    router.push(`/invoice-preview?id=${id}`);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    Alert.alert(t("order.cancelOrder"), t("order.cancelOrderConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("order.cancelOrder"),
        style: "destructive",
        onPress: async () => {
          try {
            await cancelOrder(selectedOrder.order.id);
            router.back();
          } catch {
            Alert.alert(t("common.error"), t("order.cancelOrderError"));
          }
        },
      },
    ]);
  };

  const handleRefresh = useCallback(async () => {
    if (!id) return;

    setRefreshing(true);
    try {
      await fetchOrderById(id, true);
    } catch (err) {
      console.error("Error refreshing order:", err);
    } finally {
      setRefreshing(false);
    }
  }, [id, fetchOrderById]);

  // Show skeleton while loading or content not ready
  if ((loadingDetail && !selectedOrder) || !contentReady) {
    return (
      <ThemedView className="flex-1">
        <View style={{ flex: 1 }}>
          <OrderDetailSkeleton />
        </View>
      </ThemedView>
    );
  }

  if (error || !selectedOrder) {
    return (
      <ThemedView className="flex-1">
        <ErrorState
          message={t("order_detail.load_error_message")}
          onRetry={() => id && fetchOrderById(id, true)}
        />
      </ThemedView>
    );
  }

  const { order, items } = selectedOrder;
  const canBeCancelled = ["pending", "confirmed"].includes(order.status);
  const canDownloadInvoice = ["confirmed", "shipped", "delivered"].includes(
    order.status
  );

  return (
    <>
      <ThemedView className="flex-1">
        <View style={{ flex: 1 }}>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.tint}
              />
            }
            contentContainerStyle={{
              paddingBottom: Math.max(safeAreaInsets.bottom, 16) + 16,
            }}
          >
            <View className="p-4 gap-4">
              <OrderInfoSection order={order} />
              <TrackingSection order={order} />
              <ProductsSection items={items} />
              <SummarySection order={order} />
              <DeliveryAndPaymentSection order={order} />

              {/* Action Buttons */}
              <View className="gap-3">
                {canDownloadInvoice && (
                  <BaseButton
                    variant="primary"
                    size="small"
                    onPress={downloadInvoice}
                    hapticType="medium"
                    fullWidth
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="white"
                    />
                    <Text
                      className="text-base font-semibold ml-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      {t("order_detail.actions.view_invoice")}
                    </Text>
                  </BaseButton>
                )}

                {canBeCancelled && (
                  <BaseButton
                    variant="danger"
                    size="small"
                    title={t("order_detail.cancel_order")}
                    onPress={handleCancelOrder}
                    loading={loading}
                    disabled={loading}
                    hapticType="warning"
                    fullWidth
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </ThemedView>
      <HelpModal ref={helpModalRef} />
    </>
  );
}
