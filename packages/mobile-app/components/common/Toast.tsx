// Toast.tsx
// metropolitan app
// Created by Ahmet on 21.07.2025.

import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  visible: boolean;
}

export function Toast({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  visible 
}: ToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  }, [fadeAnim, translateY, onClose]);

  useEffect(() => {
    if (visible) {
      // Göster
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Otomatik kapat
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      // Gizle
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration, fadeAnim, translateY, handleClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'warning':
        return 'bg-amber-600';
      case 'info':
      default:
        return 'bg-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        opacity: fadeAnim,
        transform: [{ translateY }],
        zIndex: 999,
      }}
    >
      <View className={`${getBackgroundColor()} rounded-lg shadow-lg flex-row items-center p-4`}>
        <Ionicons name={getIcon()} size={24} color="white" />
        <Text className="text-white flex-1 ml-3 text-base font-medium">
          {message}
        </Text>
        <TouchableOpacity onPress={handleClose} className="ml-2">
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}