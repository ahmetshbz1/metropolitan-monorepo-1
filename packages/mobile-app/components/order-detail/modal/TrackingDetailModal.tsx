//  "TrackingDetailModal.tsx"
//  metropolitan app
//  Created by Ahmet on 10.07.2025. Düzenlenme tarihi: 21.07.2025.

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { forwardRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { TrackingEvent } from "@/context/OrderContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DateFormats, formatDate } from "@/utils/date.utils";

interface TrackingDetailModalProps {
  order: {
    trackingNumber: string | null;
    shippingCompany: string;
  };
  trackingEvents: TrackingEvent[];
}

const TimelineNode = ({
  event,
  isLast,
  language,
}: {
  event: TrackingEvent;
  isLast: boolean;
  language: string;
}) => (
  <View className="flex-row">
    <View className="items-center mr-4">
      <View className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-black" />
      {!isLast && <View className="flex-1 w-0.5 bg-blue-500 mt-1" />}
    </View>
    <View className="flex-1 pb-6">
      <ThemedText className="text-base font-semibold">
        {event.statusText}
      </ThemedText>
      <ThemedText className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
        {event.location}
      </ThemedText>
      <ThemedText className="text-xs text-gray-500 mt-1.5">
        {formatDate(event.timestamp, DateFormats.SHORT_WITH_TIME, language)}
      </ThemedText>
      {event.description && (
        <ThemedText className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
          {event.description}
        </ThemedText>
      )}
    </View>
  </View>
);

export const TrackingDetailModal = forwardRef<
  BottomSheetModal,
  TrackingDetailModalProps
>(({ order, trackingEvents }, ref) => {
  const snapPoints = useMemo(() => ["65%", "90%"], []);
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t, i18n } = useTranslation();

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const copyToClipboard = async () => {
    if (order?.trackingNumber) {
      await Clipboard.setStringAsync(order.trackingNumber);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (!order || !trackingEvents) return null;

  const hasTrackingNumber =
    order.trackingNumber && order.trackingNumber.length > 0;

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      onDismiss={() => {}} // onDismiss prop removed, so providing a no-op
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.mediumGray }}
      backgroundStyle={{ backgroundColor: colors.cardBackground }}
    >
      <ThemedView className="flex-1 p-5">
        <ThemedText className="text-2xl font-bold text-center mb-2.5">
          {t("order_detail.tracking_modal.title")}
        </ThemedText>
        {hasTrackingNumber && (
          <View className="flex-row items-center justify-center mb-5">
            <ThemedText className="text-base text-gray-600 dark:text-gray-400">
              #{order.trackingNumber} ({order.shippingCompany})
            </ThemedText>
            <TouchableOpacity onPress={copyToClipboard} className="ml-4 p-1">
              <Ionicons
                name="copy-outline"
                size={24}
                className="text-blue-500"
              />
            </TouchableOpacity>
          </View>
        )}
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {trackingEvents.length > 0 ? (
            trackingEvents.map((event, index) => (
              <TimelineNode
                key={event.id}
                event={event}
                isLast={index === trackingEvents.length - 1}
                language={i18n.language}
              />
            ))
          ) : (
            <ThemedText className="text-center mt-10 text-base text-gray-500">
              {t("order_detail.tracking_modal.no_events")}
            </ThemedText>
          )}
        </BottomSheetScrollView>
      </ThemedView>
    </BottomSheetModal>
  );
});

TrackingDetailModal.displayName = "TrackingDetailModal";
