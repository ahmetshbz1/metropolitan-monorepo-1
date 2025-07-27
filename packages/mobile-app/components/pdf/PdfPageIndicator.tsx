//  "PdfPageIndicator.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ThemedText";

interface PdfPageIndicatorProps {
  currentPage: number;
  totalPages: number;
}

export const PdfPageIndicator: React.FC<PdfPageIndicatorProps> = ({
  currentPage,
  totalPages,
}) => {
  if (totalPages === 0) return null;

  return (
    <View className="absolute top-12 left-4 z-10">
      <View
        className="px-3 py-2 rounded-lg"
        style={{
          backgroundColor: "white",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <ThemedText
          className="text-sm font-medium"
          style={{ color: "black" }}
        >
          {currentPage} / {totalPages}
        </ThemedText>
      </View>
    </View>
  );
};