//  "ProductCardSkeleton.tsx"
//  metropolitan app
//  Created by Ahmet on 07.06.2025.

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { View } from "react-native";
import { ThemedView } from "../ThemedView";
import ShimmerView from "../ui/ShimmerView";

interface ProductCardSkeletonProps {
  variant?: "grid-2" | "grid-3"; // 2 column or 3 column grid
}

export function ProductCardSkeleton({ variant = "grid-3" }: ProductCardSkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Adjust sizes based on grid variant
  const isGrid2 = variant === "grid-2";
  const imageHeight = isGrid2 ? 150 : 110;
  const padding = isGrid2 ? "p-3" : "p-2";
  const nameHeight = isGrid2 ? 44 : 36;
  const badgeWidth = isGrid2 ? 60 : 40;
  const priceWidth = isGrid2 ? 80 : 60;

  return (
    <View className={isGrid2 ? "w-1/2 p-1.5 mb-1" : "flex-1 p-1"}>
      <ThemedView
        className="flex-1 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2,
        }}
      >
        <View className="flex-1">
          <ShimmerView
            style={{
              width: "100%",
              height: imageHeight,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />
          <View className={`${padding} flex-1 justify-between`}>
            <View>
              <View className={`flex-row self-start ${isGrid2 ? "mb-2" : "mb-1"} gap-1`}>
                <ShimmerView
                  style={{ width: badgeWidth, height: isGrid2 ? 20 : 16, borderRadius: isGrid2 ? 5 : 4 }}
                />
                <ShimmerView
                  style={{ width: badgeWidth, height: isGrid2 ? 20 : 16, borderRadius: isGrid2 ? 5 : 4 }}
                />
              </View>
              <View className="justify-center gap-1" style={{ height: nameHeight }}>
                <ShimmerView
                  style={{ width: "100%", height: isGrid2 ? 16 : 14, borderRadius: 4 }}
                />
                <ShimmerView
                  style={{ width: "60%", height: isGrid2 ? 16 : 14, borderRadius: 4 }}
                />
              </View>
            </View>
            <View className={`flex-row justify-between items-center ${isGrid2 ? "mt-2" : "mt-1"}`}>
              <ShimmerView style={{ width: isGrid2 ? 70 : 50, height: isGrid2 ? 14 : 12, borderRadius: 4 }} />
              <ShimmerView style={{ width: priceWidth, height: isGrid2 ? 20 : 18, borderRadius: 4 }} />
            </View>
          </View>
        </View>
      </ThemedView>
    </View>
  );
}