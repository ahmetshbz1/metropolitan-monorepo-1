//  "OrderDetailSkeleton.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { View } from "react-native";
import { BaseShimmer } from "./BaseShimmer";

export function OrderDetailSkeleton() {
  return (
    <View className="p-4 gap-4">
      {/* Order Info Section */}
      <View className="gap-3">
        <BaseShimmer height={24} width={200} />
        <BaseShimmer height={16} width={150} />
        <BaseShimmer height={16} width={120} />
      </View>

      {/* Tracking Section */}
      <View className="gap-3">
        <BaseShimmer height={20} width={180} />
        <BaseShimmer height={60} />
      </View>

      {/* Products Section */}
      <View className="gap-3">
        <BaseShimmer height={20} width={160} />
        {[...Array(3)].map((_, index) => (
          <View key={index} className="flex-row gap-3">
            <BaseShimmer height={60} width={60} borderRadius={12} />
            <View className="flex-1 gap-2">
              <BaseShimmer height={16} width="80%" />
              <BaseShimmer height={14} width="60%" />
              <BaseShimmer height={14} width={80} />
            </View>
          </View>
        ))}
      </View>

      {/* Summary Section */}
      <View className="gap-2">
        <BaseShimmer height={18} width={140} />
        {[...Array(4)].map((_, index) => (
          <View key={index} className="flex-row justify-between">
            <BaseShimmer height={14} width={100} />
            <BaseShimmer height={14} width={60} />
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View className="gap-3">
        <BaseShimmer height={48} borderRadius={16} />
        <BaseShimmer height={48} borderRadius={16} />
      </View>
    </View>
  );
}
