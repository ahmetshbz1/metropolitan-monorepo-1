//  "NipInput.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
//  Redesigned on 23.09.2025 for minimal professional design

import { BaseInput } from "@/components/base/BaseInput";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { zincColors } from "@/constants/colors/zincColors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface NipInputProps {
  nip: string;
  setNip: (val: string) => void;
  nipRef: React.RefObject<TextInput | null>;
  isNipChecking: boolean;
  themeColors: any;
  t: (key: string) => string;
  handleCheckNip: () => void;
  resetNipStatus: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function NipInput({
  nip,
  setNip,
  nipRef,
  isNipChecking,
  themeColors,
  t,
  handleCheckNip,
  resetNipStatus,
  onFocus,
  onBlur,
}: NipInputProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-row items-center gap-2">
      <View style={{ flex: 1 }}>
        <BaseInput
          ref={nipRef}
          size="small"
          variant="default"
          placeholder={t("user_info.nip_label")}
          placeholderTextColor={themeColors.mediumGray}
          value={nip}
          onChangeText={(text) => {
            setNip(text);
            resetNipStatus();
          }}
          keyboardType="number-pad"
          maxLength={10}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
      <TouchableOpacity
        className="px-4 rounded-xl h-12 justify-center items-center"
        style={{
          backgroundColor:
            nip.length === 10
              ? themeColors.tint
              : isDark ? zincColors[800] : zincColors[200],
          minWidth: 90,
        }}
        onPress={handleCheckNip}
        disabled={isNipChecking || nip.length !== 10}
      >
        {isNipChecking ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text
            className="font-medium text-sm"
            style={{
              color: nip.length === 10 ? "white" : themeColors.mediumGray
            }}
          >
            {t("user_info.nip_check_button")}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}