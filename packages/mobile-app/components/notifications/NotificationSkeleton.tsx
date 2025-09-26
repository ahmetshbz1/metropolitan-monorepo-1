//  "NotificationSkeleton.tsx"
//  Notification skeleton loader component
//  Created by Ahmet on 26.09.2025.

import { ThemedView } from "@/components/ThemedView";
import { BaseCard } from "@/components/base/BaseCard";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { View } from "react-native";

export function NotificationSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={{ marginBottom: 16 }}>
      <BaseCard
        borderRadius={16}
        style={{ opacity: 0.6 }}
        padding={0}
      >
        <ThemedView
          className="p-5 overflow-hidden rounded-2xl flex-row items-start"
          lightColor={Colors.light.card}
          darkColor={Colors.dark.card}
        >
          {/* İkon placeholder */}
          <View
            className="w-10 h-10 rounded-full mr-4 mt-1"
            style={{
              backgroundColor: colors.text + "10",
            }}
          />

          {/* İçerik placeholder */}
          <View className="flex-1">
            {/* Başlık */}
            <View className="flex-row items-start justify-between mb-2">
              <View
                className="h-4 rounded"
                style={{
                  backgroundColor: colors.text + "15",
                  width: "70%",
                }}
              />
              <View
                className="w-2.5 h-2.5 rounded-full mt-1.5"
                style={{
                  backgroundColor: colors.text + "10",
                }}
              />
            </View>

            {/* Mesaj satır 1 */}
            <View
              className="h-3 mb-1.5 rounded"
              style={{
                backgroundColor: colors.text + "10",
                width: "100%",
              }}
            />

            {/* Mesaj satır 2 */}
            <View
              className="h-3 mb-3 rounded"
              style={{
                backgroundColor: colors.text + "10",
                width: "85%",
              }}
            />

            {/* Zaman */}
            <View
              className="h-2.5 rounded"
              style={{
                backgroundColor: colors.text + "08",
                width: "30%",
              }}
            />
          </View>
        </ThemedView>
      </BaseCard>
    </View>
  );
}

export function NotificationSkeletonList() {
  return (
    <View className="px-4 pt-4">
      {[1, 2, 3, 4, 5].map((item) => (
        <NotificationSkeleton key={item} />
      ))}
    </View>
  );
}