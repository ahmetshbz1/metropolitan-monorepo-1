//  "OrderDetailContainer.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

import { ThemedView } from "@/components/ThemedView";
import { ErrorState } from "@/components/ui/ErrorState";
import { OrderDetailSkeleton } from "@/components/ui/ShimmerView";
import { OrderInfoSection } from "./OrderInfoSection";
import { TrackingSection } from "./TrackingSection";
import { ProductsSection } from "./ProductsSection";
import { SummarySection } from "./SummarySection";
import { DeliveryAndPaymentSection } from "./DeliveryAndPaymentSection";
import { ActionsSection } from "./ActionsSection";
import { HelpModal } from "./modal/HelpModal";
import Colors from "@/constants/Colors";
import { useOrders } from "@/context/OrderContext";

interface OrderDetailContainerProps {
  orderId: string;
  onDownloadInvoice?: () => void;
  onCancelOrder?: () => Promise<void>;
}

export function OrderDetailContainer({
  orderId,
  onDownloadInvoice,
  onCancelOrder,
}: OrderDetailContainerProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const safeAreaInsets = useSafeAreaInsets();

  const {
    selectedOrder,
    loadingDetail,
    fetchOrderById,
    error,
  } = useOrders();

  const helpModalRef = useRef<BottomSheetModal>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (orderId) {
      setContentReady(false);
      fetchOrderById(orderId, true);
    }
  }, [orderId, fetchOrderById]);

  // Content ready check
  useEffect(() => {
    if (selectedOrder && !loadingDetail) {
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [selectedOrder, loadingDetail]);

  const handleRefresh = useCallback(async () => {
    if (!orderId) return;

    setRefreshing(true);
    try {
      await fetchOrderById(orderId, true);
    } catch (err) {
      console.error("Error refreshing order:", err);
    } finally {
      setRefreshing(false);
    }
  }, [orderId, fetchOrderById]);

  const handlePressHelp = useCallback(() => {
    helpModalRef.current?.present();
  }, []);

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
          onRetry={() => orderId && fetchOrderById(orderId, true)}
        />
      </ThemedView>
    );
  }

  const { order, items } = selectedOrder;

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
              
              <ActionsSection
                orderData={selectedOrder}
                onPressHelp={handlePressHelp}
                onDownloadInvoice={onDownloadInvoice}
                onCancelOrder={onCancelOrder}
              />
            </View>
          </ScrollView>
        </View>
      </ThemedView>
      <HelpModal ref={helpModalRef} />
    </>
  );
}
