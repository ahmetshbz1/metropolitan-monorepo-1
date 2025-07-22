//  "useTheme.ts"
//  metropolitan app
//  Created by Ahmet on 20.06.2025.

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export const useTheme = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return {
    colors,
    colorScheme,
    isDark: colorScheme === "dark",
  };
};
