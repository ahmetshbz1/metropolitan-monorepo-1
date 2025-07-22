//  "useSearchInput.ts"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, TextInput } from "react-native";

import { useHaptics } from "@/hooks/useHaptics";

interface UseSearchInputProps {
  onSearchChange: (query: string) => void;
  initialValue?: string;
}

export const useSearchInput = ({
  onSearchChange,
  initialValue = "",
}: UseSearchInputProps) => {
  const { triggerHaptic } = useHaptics();
  const inputRef = useRef<TextInput>(null);
  const [localValue, setLocalValue] = useState(initialValue);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Ekran genişliğini al ve arama input'u için maksimum genişlik hesapla
  const screenWidth = Dimensions.get("window").width;
  const maxSearchWidth = screenWidth - 100; // Cancel button ve margin için 100px bırak

  useEffect(() => {
    if (initialValue.trim()) {
      setIsSearchMode(true);
      Animated.timing(animatedWidth, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [initialValue, animatedWidth]);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    onSearchChange(text);
  };

  const handleSearchPress = () => {
    triggerHaptic("light");
    setIsSearchMode(true);
    Animated.timing(animatedWidth, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      inputRef.current?.focus();
    });
  };

  const handleCancel = () => {
    triggerHaptic("medium");
    setLocalValue("");
    onSearchChange("");
    setIsSearchMode(false);
    Animated.timing(animatedWidth, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleInputClear = () => {
    triggerHaptic("light");
    setLocalValue("");
    onSearchChange("");
  };

  const animatedStyle = {
    width: animatedWidth.interpolate({
      inputRange: [0, 1],
      outputRange: [0, maxSearchWidth],
    }),
    opacity: animatedWidth,
  };

  return {
    inputRef,
    localValue,
    isSearchMode,
    animatedStyle,
    handleChangeText,
    handleSearchPress,
    handleCancel,
    handleInputClear,
  };
};
