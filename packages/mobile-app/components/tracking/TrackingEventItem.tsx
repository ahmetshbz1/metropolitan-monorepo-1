//  "TrackingEventItem.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ThemedText } from "@/components/ThemedText";
import { TrackingEvent } from "@metropolitan/shared";

interface TrackingEventItemProps {
  event: TrackingEvent;
  index: number;
  isLast: boolean;
  getTrackingIcon: (status: string) => string;
  getStatusColor: (status: string) => string;
  getIconColor: (status: string) => string;
  colors: any;
}

export const TrackingEventItem: React.FC<TrackingEventItemProps> = ({
  event,
  index,
  isLast,
  getTrackingIcon,
  getStatusColor,
  getIconColor,
  colors,
}) => {
  return (
    <View className="flex-row pb-5">
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
        {!isLast && (
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
          {format(new Date(event.timestamp), "dd MMMM yyyy, HH:mm")}
        </ThemedText>
      </View>
    </View>
  );
};