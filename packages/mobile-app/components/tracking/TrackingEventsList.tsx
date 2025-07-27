//  "TrackingEventsList.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { BaseCard } from "@/components/base/BaseCard";
import { ThemedText } from "@/components/ThemedText";
import { TrackingEventItem } from "./TrackingEventItem";
import { TrackingEvent } from "@metropolitan/shared";
import { useTrackingHelpers } from "@/hooks/tracking/useTrackingHelpers";

interface TrackingEventsListProps {
  trackingEvents: TrackingEvent[];
  colors: any;
}

export const TrackingEventsList: React.FC<TrackingEventsListProps> = ({
  trackingEvents,
  colors,
}) => {
  const { t } = useTranslation();
  const { getTrackingIcon, getStatusColor, getIconColor } = useTrackingHelpers(colors);

  return (
    <BaseCard>
      <ThemedText className="text-lg font-semibold mb-4">
        {t("order_detail.tracking_modal.history.title")}
      </ThemedText>

      {trackingEvents.length > 0 ? (
        <View>
          {trackingEvents.map((event, index) => (
            <TrackingEventItem
              key={event.id}
              event={event}
              index={index}
              isLast={index === trackingEvents.length - 1}
              getTrackingIcon={getTrackingIcon}
              getStatusColor={getStatusColor}
              getIconColor={getIconColor}
              colors={colors}
            />
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
  );
};