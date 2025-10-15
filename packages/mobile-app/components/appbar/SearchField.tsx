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
import { zincColors } from "@/constants/colors/zincColors";

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
  const { colors, textInputStyle, isDark } = useSearchInputStyles();

  return (
    <View className="flex-row items-center">
      <Animated.View
        style={[
          {
            backgroundColor: isDark ? zincColors[900] : zincColors[100],
            borderRadius: SEARCH_INPUT_CONFIG.border.radius,
            paddingHorizontal: SEARCH_INPUT_CONFIG.spacing.containerPadding,
            height: SEARCH_INPUT_CONFIG.sizes.height,
            marginRight: SEARCH_INPUT_CONFIG.spacing.containerMargin,
            flexDirection: "row",
            alignItems: "center",
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name="search"
          size={SEARCH_INPUT_CONFIG.sizes.searchIconSmall}
          color={isDark ? zincColors[500] : zincColors[400]}
          style={{ marginRight: SEARCH_INPUT_CONFIG.spacing.iconMargin }}
        />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || t("tabs.search_placeholder")}
          placeholderTextColor={isDark ? zincColors[500] : zincColors[400]}
          style={[
            textInputStyle,
            {
              flex: 1,
              fontSize: SEARCH_INPUT_CONFIG.text.fontSize,
              color: isDark ? zincColors[50] : zincColors[900],
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
            style={{
              padding: SEARCH_INPUT_CONFIG.spacing.clearPadding,
              marginLeft: SEARCH_INPUT_CONFIG.spacing.clearMargin,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle"
              size={SEARCH_INPUT_CONFIG.sizes.clearIcon}
              color={isDark ? zincColors[500] : zincColors[400]}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      <TouchableOpacity
        onPress={onCancel}
        style={{ padding: SEARCH_INPUT_CONFIG.spacing.buttonPadding }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="close"
          size={SEARCH_INPUT_CONFIG.sizes.closeIcon}
          color={colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};