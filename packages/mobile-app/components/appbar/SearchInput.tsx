//  "SearchInput.tsx"
//  metropolitan app
//  Created by Ahmet on 12.06.2025.

import React from "react";

import { SearchButton } from "@/components/appbar/SearchButton";
import { SearchField } from "@/components/appbar/SearchField";
import { useSearchInput } from "@/hooks/useSearchInput";

interface SearchInputProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export function SearchInput({
  onSearchChange,
  placeholder,
  initialValue = "",
}: SearchInputProps) {
  const {
    inputRef,
    localValue,
    isSearchMode,
    animatedStyle,
    handleChangeText,
    handleSearchPress,
    handleCancel,
    handleInputClear,
  } = useSearchInput({ onSearchChange, initialValue });

  if (!isSearchMode) {
    return <SearchButton onPress={handleSearchPress} />;
  }

  return (
    <SearchField
      inputRef={inputRef}
      value={localValue}
      onChangeText={handleChangeText}
      onClear={handleInputClear}
      onCancel={handleCancel}
      placeholder={placeholder}
      animatedStyle={animatedStyle}
    />
  );
}
