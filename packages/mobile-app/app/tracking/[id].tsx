//  "[id].tsx"
//  metropolitan app
//  Created by Ahmet on 09.06.2025. Düzenlenme tarihi: 21.07.2025.

import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TrackingOrderInfo } from "@/components/tracking/TrackingOrderInfo";
import { TrackingEventsList } from "@/components/tracking/TrackingEventsList";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTrackingData } from "@/hooks/tracking/useTrackingData";
import { useClipboard } from "@/hooks/tracking/useClipboard";

export default function TrackingDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Stack navigator için safe area bottom padding
  const paddingBottom =
    Platform.OS === "ios"
      ? Math.max(insets.bottom, 16) + 10
      : Math.max(insets.bottom, 16) + 8;

  // Tracking data management
  const { selectedOrder, refreshing, handleRefresh } = useTrackingData(id);
  
  // Clipboard functionality
  const { copied, copyToClipboard } = useClipboard();

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
          <TrackingOrderInfo
            order={order}
            onCopyTracking={copyToClipboard}
            copied={copied}
            colors={colors}
          />

          <TrackingEventsList
            trackingEvents={trackingEvents}
            colors={colors}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}
