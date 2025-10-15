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
        style={[
          {
            backgroundColor: colors.card,
            borderRadius: SEARCH_INPUT_CONFIG.border.radius,
            paddingHorizontal: SEARCH_INPUT_CONFIG.spacing.containerPadding,
            paddingVertical: SEARCH_INPUT_CONFIG.spacing.verticalPadding,
            marginRight: SEARCH_INPUT_CONFIG.spacing.containerMargin,
            flexDirection: "row",
            alignItems: "center",
            ...shadowStyle,
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name="search"
          size={SEARCH_INPUT_CONFIG.sizes.searchIconSmall}
          color={colors.mediumGray}
          style={{ marginRight: SEARCH_INPUT_CONFIG.spacing.iconMargin }}
        />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || t("tabs.search_placeholder")}
          placeholderTextColor={colors.mediumGray}
          style={[
            textInputStyle,
            {
              flex: 1,
              fontSize: SEARCH_INPUT_CONFIG.text.fontSize,
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
              color={colors.mediumGray}
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