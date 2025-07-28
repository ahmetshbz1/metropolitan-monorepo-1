//  "ShimmerView.tsx"
//  metropolitan app
//  Created by Ahmet on 12.06.2025.

import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Re-export skeleton components
export { BaseShimmer } from "./skeletons/BaseShimmer";

interface ShimmerViewProps {
  style?: ViewStyle;
  className?: string;
  width?: number | "auto" | `${number}%`;
  height?: number;
}

const ShimmerView: React.FC<ShimmerViewProps> = ({
  style,
  className,
  width,
  height,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [colors.lightGray, colors.border]
    );
    return {
      backgroundColor,
    };
  });

  const shimmerStyle: ViewStyle = {
    borderRadius: 8,
    overflow: "hidden",
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
  };

  return (
    <Animated.View
      className={className}
      style={[shimmerStyle, animatedStyle, style]}
    />
  );
};

// Order Detail Skeleton Component
export const OrderDetailSkeleton = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View className="p-4 gap-4" style={{ backgroundColor: colors.background }}>
      {/* Order Info Card */}
      <View
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <ShimmerView width={120} height={16} style={{ marginBottom: 8 }} />
            <ShimmerView width={80} height={20} />
          </View>
          <View className="items-end">
            <ShimmerView width={100} height={16} style={{ marginBottom: 8 }} />
            <ShimmerView width={120} height={16} />
          </View>
        </View>
      </View>

      {/* Tracking Card */}
      <View
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <ShimmerView width={140} height={18} style={{ marginBottom: 12 }} />
        <ShimmerView width="90%" height={16} />
      </View>

      {/* Products Card */}
      <View
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <ShimmerView width={120} height={18} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((item) => (
          <View key={item} className="flex-row items-center mb-4 py-2.5">
            <ShimmerView width={60} height={60} style={{ borderRadius: 8 }} />
            <View className="flex-1 ml-4">
              <ShimmerView
                width="80%"
                height={16}
                style={{ marginBottom: 8 }}
              />
              <ShimmerView width="40%" height={14} />
            </View>
            <ShimmerView width={60} height={16} />
          </View>
        ))}
        <View className="h-px my-2" style={{ backgroundColor: "#eee" }} />
        <ShimmerView
          width={150}
          height={14}
          style={{ alignSelf: "flex-end" }}
        />
      </View>

      {/* Summary Card */}
      <View
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <ShimmerView width={100} height={18} style={{ marginBottom: 16 }} />
        <View className="flex-row justify-between mb-2">
          <ShimmerView width={80} height={16} />
          <ShimmerView width={100} height={16} />
        </View>
        <View className="flex-row justify-between mb-2">
          <ShimmerView width={60} height={16} />
          <ShimmerView width={80} height={16} />
        </View>
        <View className="h-px my-3" style={{ backgroundColor: "#eee" }} />
        <View className="flex-row justify-between">
          <ShimmerView width={70} height={18} />
          <ShimmerView width={120} height={18} />
        </View>
      </View>

      {/* Delivery & Payment Card */}
      <View
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <ShimmerView width={150} height={18} style={{ marginBottom: 16 }} />
        <View className="flex-row items-center mb-4">
          <ShimmerView width={24} height={24} style={{ borderRadius: 12 }} />
          <View className="flex-1 ml-4">
            <ShimmerView width={120} height={14} style={{ marginBottom: 6 }} />
            <ShimmerView width="90%" height={16} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default ShimmerView;
