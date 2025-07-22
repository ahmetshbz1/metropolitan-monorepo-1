//  "[id].tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025. Düzenlenme tarihi: 21.07.2025.

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BaseCard } from "@/components/base/BaseCard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useOrders } from "@/context/OrderContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import { DateFormats, formatDate } from "@/utils/date.utils";
import { format } from "date-fns";

export default function TrackingDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { triggerHaptic } = useHaptics();
  const insets = useSafeAreaInsets();

  // Stack navigator için safe area bottom padding
  const paddingBottom =
    Platform.OS === "ios"
      ? Math.max(insets.bottom, 16) + 10
      : Math.max(insets.bottom, 16) + 8;

  const { selectedOrder, fetchOrderById } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("order_detail.tracking_modal.title"),
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
    });
  }, [navigation, t, colors.background, colors.text]);

  useEffect(() => {
    if (id) {
      // Tracking sayfasında her zaman fresh data iste
      fetchOrderById(id, true);
    }
  }, [id, fetchOrderById]);

  const handleRefresh = async () => {
    if (!id) return;

    setRefreshing(true);
    try {
      await fetchOrderById(id, true);
    } catch (error) {
      console.error("Error refreshing tracking:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const copyTrackingNumber = async (trackingNumber: string) => {
    try {
      await Clipboard.setStringAsync(trackingNumber);
      triggerHaptic("light");

      // Kopyalandı feedback'i göster
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000); // 2 saniye sonra gizle
    } catch (error) {
      console.error("Error copying tracking number:", error);
    }
  };

  if (!selectedOrder) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 justify-center items-center">
          <ThemedText>{t("common.loading")}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const { order, trackingEvents } = selectedOrder;

  const getTrackingIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "info_received":
        return "document-text-outline";
      case "picked_up":
        return "cube-outline";
      case "arrived_at_hub":
        return "business-outline";
      case "out_for_delivery":
        return "car-outline";
      case "delivered":
        return "checkmark-circle-outline";
      default:
        return "ellipse-outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return colors.statusBadge.delivered.background;
      case "out_for_delivery":
        return colors.statusBadge.shipped.background;
      case "arrived_at_hub":
        return colors.statusBadge.confirmed.background;
      default:
        return colors.statusBadge.pending.background;
    }
  };

  const getIconColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return colors.statusBadge.delivered.text;
      case "out_for_delivery":
        return colors.statusBadge.shipped.text;
      case "arrived_at_hub":
        return colors.statusBadge.confirmed.text;
      default:
        return colors.statusBadge.pending.text;
    }
  };

  return (
    <ThemedView className="flex-1">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        className="flex-1"
        contentContainerStyle={{
          paddingBottom,
        }}
      >
        <View className="p-4 gap-4">
          {/* Order Info */}
          <BaseCard>
            <ThemedText className="text-lg font-semibold mb-1">
              {t("orders.order_no", { id: order.orderNumber })}
            </ThemedText>
            <ThemedText className="text-sm opacity-70 mb-3">
              {formatDate(order.createdAt, DateFormats.FULL_WITH_TIME, i18n.language)}
            </ThemedText>
            {order.trackingNumber && (
              <View className="flex-row items-center gap-2">
                <ThemedText className="text-sm opacity-70">
                  {t("order_detail.tracking.tracking_number")}:
                </ThemedText>
                <TouchableOpacity
                  onPress={() =>
                    order.trackingNumber &&
                    copyTrackingNumber(order.trackingNumber)
                  }
                  className="flex-row items-center gap-1"
                >
                  <ThemedText
                    className="text-sm font-semibold"
                    style={{
                      color: copied ? colors.success : colors.tint,
                    }}
                  >
                    {copied ? t("common.copied") : order.trackingNumber}
                  </ThemedText>
                  <Ionicons
                    name={copied ? "checkmark-outline" : "copy-outline"}
                    size={16}
                    color={copied ? colors.success : colors.tint}
                  />
                </TouchableOpacity>
              </View>
            )}
          </BaseCard>

          {/* Tracking Events */}
          <BaseCard>
            <ThemedText className="text-lg font-semibold mb-4">
              {t("order_detail.tracking_modal.history.title")}
            </ThemedText>

            {trackingEvents.length > 0 ? (
              <View>
                {trackingEvents.map((event, index) => (
                  <View key={event.id} className="flex-row pb-5">
                    <View className="items-center mr-4">
                      <View
                        className="w-10 h-10 rounded-full justify-center items-center"
                        style={{
                          backgroundColor: getStatusColor(event.status),
                        }}
                      >
                        <Ionicons
                          name={getTrackingIcon(event.status)}
                          size={20}
                          color={getIconColor(event.status)}
                        />
                      </View>
                      {index < trackingEvents.length - 1 && (
                        <View
                          className="w-0.5 flex-1 mt-2"
                          style={{ backgroundColor: colors.border }}
                        />
                      )}
                    </View>

                    <View className="flex-1 pt-0.5">
                      <ThemedText className="text-base font-semibold mb-1">
                        {event.statusText}
                      </ThemedText>
                      <ThemedText className="text-sm opacity-80 mb-1">
                        {event.location}
                      </ThemedText>
                      {event.description && (
                        <ThemedText className="text-sm opacity-70 mb-2">
                          {event.description}
                        </ThemedText>
                      )}
                      <ThemedText className="text-xs opacity-60">
                        {format(
                          new Date(event.timestamp),
                          "dd MMMM yyyy, HH:mm"
                        )}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-10">
                <Ionicons
                  name="information-circle-outline"
                  size={48}
                  color={colors.mediumGray}
                />
                <ThemedText className="mt-3 opacity-70 text-center">
                  {t("order_detail.tracking.no_tracking_info")}
                </ThemedText>
              </View>
            )}
          </BaseCard>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
