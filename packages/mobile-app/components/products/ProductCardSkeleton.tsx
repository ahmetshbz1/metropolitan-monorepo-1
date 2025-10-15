//  "ProductCardSkeleton.tsx"
//  metropolitan app
//  Modern skeleton loader for product cards

import { View } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import ShimmerView from "../ui/ShimmerView";

export function ProductCardSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Image Skeleton */}
      <ShimmerView
        style={{
          aspectRatio: 1,
          width: "100%",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      />

      {/* Content Skeleton */}
      <View style={{ padding: 12 }}>
        {/* Product Name Lines */}
        <View style={{ marginBottom: 6, gap: 4 }}>
          <ShimmerView
            style={{
              width: "100%",
              height: 14,
              borderRadius: 4,
            }}
          />
          <ShimmerView
            style={{
              width: "70%",
              height: 14,
              borderRadius: 4,
            }}
          />
        </View>

        {/* Price and Size Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <ShimmerView
            style={{
              width: 60,
              height: 16,
              borderRadius: 4,
            }}
          />
          <ShimmerView
            style={{
              width: 40,
              height: 12,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    </View>
  );
}
