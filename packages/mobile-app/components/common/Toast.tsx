// Toast.tsx
// metropolitan app
// Created by Ahmet on 21.07.2025.

import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, Text, View, TouchableOpacity, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  visible: boolean;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  visible,
  actionLabel,
  onActionPress
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const gestureTranslateY = useRef(new Animated.Value(0)).current;

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
      Animated.timing(gestureTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  }, [fadeAnim, translateY, gestureTranslateY, onClose]);

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

  // PanResponder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Sadece yukarı kaydırma hareketine cevap ver
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Sadece yukarı kaydırmaya izin ver
        if (gestureState.dy < 0) {
          gestureTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Eğer yeterince yukarı kaydırıldıysa (50px) toast'ı kapat
        if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(gestureTranslateY, {
              toValue: -200,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose?.();
          });
        } else {
          // Geri döndür
          Animated.spring(gestureTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 15,
            stiffness: 150,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        right: 16,
        opacity: fadeAnim,
        transform: [{ translateY }, { translateY: gestureTranslateY }],
        zIndex: 999,
      }}
    >
      <View className={`${getBackgroundColor()} rounded-lg shadow-lg p-4`}>
        <View className="flex-row items-center">
          <Ionicons name={getIcon()} size={24} color="white" />
          <Text className="text-white flex-1 ml-3 text-base font-medium">
            {message}
          </Text>
          <TouchableOpacity onPress={handleClose} className="ml-2">
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
        {actionLabel && onActionPress && (
          <TouchableOpacity
            onPress={() => {
              onActionPress();
              handleClose();
            }}
            className="mt-3 bg-white/20 rounded-md py-2 px-4 self-start"
          >
            <Text className="text-white font-semibold text-sm">{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}