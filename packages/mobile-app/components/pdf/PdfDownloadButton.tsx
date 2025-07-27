//  "PdfDownloadButton.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticButton } from "../HapticButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PdfDownloadButtonProps {
  onPress: () => void;
  downloading: boolean;
  colors: any;
}

export const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({
  onPress,
  downloading,
  colors,
}) => {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View
      className="absolute right-6"
      style={{ bottom: safeAreaInsets.bottom + 24 }}
    >
      <HapticButton
        onPress={onPress}
        isLoading={downloading}
        disabled={downloading}
        hapticType="medium"
        className="w-14 h-14 rounded-full justify-center items-center"
        style={{
          backgroundColor: colors.tint,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons
          name={downloading ? "download" : "download-outline"}
          size={24}
          color="white"
        />
      </HapticButton>
    </View>
  );
};