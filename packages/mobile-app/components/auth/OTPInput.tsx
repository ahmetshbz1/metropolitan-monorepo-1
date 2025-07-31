//  "OTPInput.tsx"
//  metropolitan app
//  Created by Ahmet on 02.07.2025.

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import React, { useEffect, useRef } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const codeLength = 6;

const Digit = ({
  digit,
  isFocused,
  isError,
}: {
  digit: string;
  isFocused: boolean;
  isError: boolean;
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const translateY = useSharedValue(digit ? 0 : 20);
  const opacity = useSharedValue(digit ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (digit) {
      translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(20, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [digit, translateY, opacity]);

  const borderColor = isError
    ? themeColors.danger
    : isFocused
      ? themeColors.tint
      : themeColors.border;

  return (
    <View
      className="w-14 h-16 rounded-xl border justify-center items-center overflow-hidden"
      style={{
        borderColor: borderColor,
        backgroundColor: themeColors.backgroundSecondary,
      }}
    >
      <Animated.Text
        className="text-3xl font-semibold"
        style={[{ color: themeColors.text }, animatedStyle]}
      >
        {digit}
      </Animated.Text>
    </View>
  );
};

type OTPInputProps = {
  code: string;
  setCode: (code: string) => void;
  onSubmit: () => void;
  isError?: boolean;
};

export const OTPInput = ({
  code,
  setCode,
  onSubmit,
  isError = false,
}: OTPInputProps) => {
  const inputRef = useRef<TextInput>(null);
  const shakeTranslateX = useSharedValue(0);
  const { triggerHaptic } = useHaptics();
  const prevErrorRef = useRef(false);

  const shakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeTranslateX.value }],
    };
  });

  useEffect(() => {
    // Sadece error state false'dan true'ya geçtiğinde titret
    if (isError && !prevErrorRef.current) {
      triggerHaptic("error", true);
      shakeTranslateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
    
    // Önceki error state'ini güncelle
    prevErrorRef.current = isError;
  }, [isError, shakeTranslateX, triggerHaptic]);

  return (
    <Animated.View style={shakeStyle}>
      <TouchableOpacity
        className="flex-row justify-center gap-3"
        onPress={() => inputRef.current?.focus()}
      >
        {Array.from({ length: codeLength }).map((_, index) => (
          <Digit
            key={index}
            digit={code[index] || ""}
            isFocused={index === code.length}
            isError={isError}
          />
        ))}
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        className="absolute w-px h-px opacity-0"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={codeLength}
        onSubmitEditing={onSubmit}
        autoFocus
        textContentType="oneTimeCode"
      />
    </Animated.View>
  );
};
