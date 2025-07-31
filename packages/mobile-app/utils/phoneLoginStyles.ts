//  "phoneLoginStyles.ts"
//  metropolitan app
//  Created by Ahmet on 11.06.2025.

import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export const usePhoneLoginStyles = () => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const safeAreaInsets = useSafeAreaInsets();

  return {
    stickyViewStyle: {
      backgroundColor: themeColors.background,
      paddingBottom: safeAreaInsets.bottom || 16,
    },
    themeColors,
  };
};

export const PHONE_LOGIN_LAYOUT = {
  headerPadding: 16,
  contentPadding: 24,
  buttonPadding: 16,
} as const;
