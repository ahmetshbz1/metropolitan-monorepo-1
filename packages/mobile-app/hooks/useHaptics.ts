//  "useHaptics.ts"
//  metropolitan app
//  Created by Ahmet on 30.06.2025.

import { useUserSettings } from "@/context/UserSettings";
import * as Haptics from "expo-haptics";
import { GestureResponderEvent, Platform } from "react-native";

export function useHaptics() {
  const { settings } = useUserSettings();

  const triggerHaptic = (force = false) => {
    if (!settings.hapticsEnabled && !force) return;

    if (Platform.OS === "ios" || Platform.OS === "android") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {}
    }
  };

  const withHapticFeedback = (
    callback?: (event?: GestureResponderEvent) => void
  ) => {
    return (event?: GestureResponderEvent) => {
      triggerHaptic();
      if (callback) {
        callback(event);
      }
    };
  };

  return {
    triggerHaptic,
    withHapticFeedback,
    isEnabled: settings.hapticsEnabled,
  };
}
