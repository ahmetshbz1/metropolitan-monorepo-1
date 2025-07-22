//  "NipInput.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { BaseInput } from "@/components/base/BaseInput";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  return (
    <View>
      <Text
        className="text-sm font-medium mb-2 pl-1 opacity-80"
        style={{ color: themeColors.text }}
      >
        {t("user_info.nip_label")}
      </Text>
      <View className="flex-row items-center gap-3">
        <View style={{ flex: 1 }}>
          <BaseInput
            ref={nipRef}
            size="small"
            placeholder={t("user_info.nip_placeholder")}
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
          className="px-6 py-4 rounded-xl h-14 justify-center items-center"
          style={{
            backgroundColor:
              nip.length === 10 ? themeColors.tint : themeColors.disabled,
            minWidth: 100,
          }}
          onPress={handleCheckNip}
          disabled={isNipChecking || nip.length !== 10}
        >
          {isNipChecking ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-semibold text-sm">
              {t("user_info.nip_check_button")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
