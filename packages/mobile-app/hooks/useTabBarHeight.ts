//  "useTabBarHeight.ts"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";

/**
 * TabBar yüksekliğini ve içerik için gerekli padding değerini döndürür
 */
export function useTabBarHeight() {
  // @react-navigation/bottom-tabs'dan gelen hook'u kullan
  const tabBarHeight = useBottomTabBarHeight();

  // Platform'a göre ekstra padding değeri
  const extraPadding = Platform.OS === "ios" ? 10 : 5;

  return {
    height: tabBarHeight,
    paddingBottom: tabBarHeight + extraPadding,
  };
}
