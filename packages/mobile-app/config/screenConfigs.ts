//  "screenConfigs.ts"
//  metropolitan app
//  Created by Ahmet on 08.06.2025.

import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

interface RouteProps {
  route: {
    params?: Record<string, any>;
    name: string;
  };
  navigation: any;
}

export interface ScreenConfig {
  name: string;
  options: NativeStackNavigationOptions | ((props: RouteProps) => NativeStackNavigationOptions);
}

export const SCREEN_CONFIGS = {
  // Ana ekranlar
  auth: {
    name: "(auth)",
    options: { headerShown: false },
  },
  tabs: {
    name: "(tabs)",
    options: { headerShown: false },
  },
  checkout: {
    name: "checkout",
    options: { headerShown: false },
  },
  notFound: {
    name: "+not-found",
    options: {},
  },
} as const;

export const DYNAMIC_SCREEN_CONFIGS: ScreenConfig[] = [
  {
    name: "product/[id]",
    options: ({ route }: RouteProps) => ({
      headerShown: true,
      headerTitle: "", // Dinamik olarak ayarlanacak
      headerStyle: {
        backgroundColor: undefined, // colors.background - dinamik olarak ayarlanacak
      },
      headerTintColor: undefined, // colors.text - dinamik olarak ayarlanacak
      // Header butonları product screen içinde dinamik olarak ayarlanacak
    }),
  },
];

export const STATIC_SCREEN_CONFIGS: ScreenConfig[] = [
  {
    name: "add-address",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - add_address.title
    },
  },
  {
    name: "edit-address",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - edit_address.title
    },
  },
  {
    name: "addresses",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - addresses.title
    },
  },
  {
    name: "edit-profile",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - edit_profile.title
    },
  },
  {
    name: "favorites",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - favorites.title
    },
  },
  {
    name: "help-center",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - help_center.title
    },
  },
  {
    name: "faq",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - faq.title
    },
  },
  {
    name: "order/[id]",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - order_detail.title
    },
  },
  {
    name: "tracking/[id]",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - sipariş takibi
    },
  },
  {
    name: "invoice-preview",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak
    },
  },
];

export const LAYOUT_CONFIG = {
  headerStyle: {
    android: {
      elevation: 0,
    },
  },
  headerOptions: {
    shadowVisible: false,
    backButtonDisplayMode: "default" as const, // iOS'ta metin de göster
  },
  headerTitleStyle: {
    fontWeight: "600" as const,
    fontSize: 17,
  },
} as const;
