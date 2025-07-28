// Theme type definitions for the mobile app
// All UI color and theme-related types

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryForeground: string;
  
  // Background colors
  background: string;
  secondaryBackground: string;
  tertiaryBackground: string;
  modalBackground: string;
  inputBackground: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  mutedForeground: string;
  inputText: string;
  placeholderText: string;
  
  // Border colors
  border: string;
  borderLight: string;
  inputBorder: string;
  
  // Status colors
  success: string;
  successBackground: string;
  error: string;
  errorBackground: string;
  warning: string;
  warningBackground: string;
  info: string;
  infoBackground: string;
  
  // Component specific colors
  cardBackground: string;
  ripple: string;
  skeletonBase: string;
  skeletonHighlight: string;
  
  // Tab and navigation colors
  tabIconDefault: string;
  tabIconSelected: string;
  
  // Order status colors
  orderPending: string;
  orderProcessing: string;
  orderShipped: string;
  orderDelivered: string;
  orderCancelled: string;
  
  // Additional UI colors
  overlay: string;
  divider: string;
  link: string;
  badge: string;
  badgeText: string;
}

export interface Theme {
  colors: ThemeColors;
}

// Type for color scheme
export type ColorScheme = 'light' | 'dark';

// Helper type for components that accept theme colors
export interface ThemedProps {
  colors: ThemeColors;
  colorScheme: ColorScheme;
}