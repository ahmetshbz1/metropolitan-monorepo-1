//  "SearchField.tsx"
//  metropolitan app
//  Created by Ahmet on 28.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Animated, TextInput, TouchableOpacity, View } from "react-native";

import {
  SEARCH_INPUT_CONFIG,
  useSearchInputStyles,
} from "@/utils/searchInputStyles";

interface SearchFieldProps {
  inputRef: React.RefObject<TextInput | null>;
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onCancel: () => void;
  placeholder?: string;
  animatedStyle: any;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  inputRef,
  value,
  onChangeText,
  onClear,
  onCancel,
  placeholder,
  animatedStyle,
}) => {
  const { t } = useTranslation();
  const { colors, textInputStyle, shadowStyle } = useSearchInputStyles();

  return (
    <View className="flex-row items-center">
      <Animated.View
        className="flex-row items-center rounded-xl px-3 py-2 mr-2"
        style={[
          {
            backgroundColor: colors.card,
            ...shadowStyle,
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name="search"
          size={SEARCH_INPUT_CONFIG.sizes.searchIconSmall}
          color={colors.mediumGray}
          className="mr-2"
        />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || t("tabs.search_placeholder")}
          placeholderTextColor={colors.mediumGray}
          className="flex-1 text-base"
          style={[
            textInputStyle,
            {
              textAlignVertical: "center",
              paddingVertical: 0,
              includeFontPadding: false,
              lineHeight: SEARCH_INPUT_CONFIG.text.lineHeight,
            },
          ]}
          returnKeyType="search"
          clearButtonMode="never"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            className="p-0.5 ml-1"
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle"
              size={SEARCH_INPUT_CONFIG.sizes.clearIcon}
              color={colors.mediumGray}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      <TouchableOpacity onPress={onCancel} className="p-2" activeOpacity={0.7}>
        <Ionicons
          name="close"
          size={SEARCH_INPUT_CONFIG.sizes.closeIcon}
          color={colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};
