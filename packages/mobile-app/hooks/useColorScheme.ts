//  "useColorScheme.ts"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

import { useContext } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { ColorSchemeContext } from "@/context/ColorSchemeContext";

// Override React Native's useColorScheme to use our custom implementation
export function useColorScheme() {
  try {
    // Try to get from our custom context
    const context = useContext(ColorSchemeContext);
    if (context) {
      return context.colorScheme;
    }
  } catch (error) {
    // If context is not available, fall back to React Native's hook
  }
  
  // Fallback to React Native's useColorScheme
  return useRNColorScheme();
}
