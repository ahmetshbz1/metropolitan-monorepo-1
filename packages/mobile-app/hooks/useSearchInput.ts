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

const DEBOUNCE_DELAY = 300;

export const useSearchInput = ({
  onSearchChange,
  initialValue = "",
}: UseSearchInputProps) => {
  const { triggerHaptic } = useHaptics();
  const inputRef = useRef<TextInput>(null);
  const [localValue, setLocalValue] = useState(initialValue);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Ekran genişliğini al ve arama input'u için maksimum genişlik hesapla
  const screenWidth = Dimensions.get("window").width;
  const maxSearchWidth = screenWidth - 60; // Cancel button ve margin için 60px bırak

  useEffect(() => {
    if (initialValue.trim()) {
      setIsSearchMode(true);
      Animated.timing(animatedWidth, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [initialValue, animatedWidth]);

  // Debounce cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleChangeText = (text: string) => {
    setLocalValue(text);

    // Önceki timer'ı iptal et
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Yeni timer başlat
    debounceTimer.current = setTimeout(() => {
      onSearchChange(text);
    }, DEBOUNCE_DELAY);
  };

  const handleSearchPress = () => {
    triggerHaptic();
    setIsSearchMode(true);
    Animated.timing(animatedWidth, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      inputRef.current?.focus();
    });
  };

  const handleCancel = () => {
    triggerHaptic();

    // Timer'ı iptal et
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setLocalValue("");
    onSearchChange("");
    setIsSearchMode(false);
    Animated.timing(animatedWidth, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleInputClear = () => {
    triggerHaptic();

    // Timer'ı iptal et
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

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
