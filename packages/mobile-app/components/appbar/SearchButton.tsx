//  "SearchButton.tsx"
//  metropolitan app
//  Created by Ahmet on 28.06.2025.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";

import {
  SEARCH_INPUT_CONFIG,
  useSearchInputStyles,
} from "@/utils/searchInputStyles";

interface SearchButtonProps {
  onPress: () => void;
}

export const SearchButton: React.FC<SearchButtonProps> = ({ onPress }) => {
  const { colors } = useSearchInputStyles();

  return (
    <TouchableOpacity onPress={onPress} className="p-2" activeOpacity={0.7}>
      <Ionicons
        name="search"
        size={SEARCH_INPUT_CONFIG.sizes.searchIcon}
        color={colors.text}
      />
    </TouchableOpacity>
  );
};
