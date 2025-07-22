//  "ProductCardSkeleton.tsx"
//  metropolitan app
//  Created by Ahmet on 07.06.2025.

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { View } from "react-native";
import { ThemedView } from "../ThemedView";
import ShimmerView from "../ui/ShimmerView";

export function ProductCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View className="w-1/2 p-1.5 mb-1">
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
              height: 150,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />
          <View className="p-3 flex-1 justify-between">
            <View>
              <View className="flex-row self-start mb-2 gap-1.5">
                <ShimmerView
                  style={{ width: 60, height: 20, borderRadius: 5 }}
                />
                <ShimmerView
                  style={{ width: 60, height: 20, borderRadius: 5 }}
                />
              </View>
              <View className="justify-center gap-1.5" style={{ height: 44 }}>
                <ShimmerView
                  style={{ width: "100%", height: 16, borderRadius: 4 }}
                />
                <ShimmerView
                  style={{ width: "60%", height: 16, borderRadius: 4 }}
                />
              </View>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <ShimmerView style={{ width: 70, height: 14, borderRadius: 4 }} />
              <ShimmerView style={{ width: 80, height: 20, borderRadius: 4 }} />
            </View>
          </View>
        </View>
      </ThemedView>
    </View>
  );
}
