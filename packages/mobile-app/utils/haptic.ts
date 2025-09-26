//  "haptic.ts"
//  metropolitan app
//  Created by Ahmet on 26.09.2025.

import * as Haptics from "expo-haptics";

export async function showHaptic(type: "light" | "medium" | "heavy" | "success" | "error" = "light") {
  try {
    switch (type) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Haptic feedback desteklenmiyor veya hata oluştu
    // Removed console statement
  }
}