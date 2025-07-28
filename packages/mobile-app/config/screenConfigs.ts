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
      headerBackTitle: "",
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
      headerBackTitle: "",
    },
  },
  {
    name: "edit-address",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - edit_address.title
      headerBackTitle: "",
    },
  },
  {
    name: "addresses",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - addresses.title
      headerBackTitle: "",
    },
  },
  {
    name: "edit-profile",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - edit_profile.title
      headerBackTitle: "",
    },
  },
  {
    name: "favorites",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - favorites.title
      headerBackTitle: "",
    },
  },
  {
    name: "help-center",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - help_center.title
      headerBackTitle: "",
    },
  },
  {
    name: "faq",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - faq.title
      headerBackTitle: "",
    },
  },
  {
    name: "order/[id]",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - order_detail.title
      headerBackTitle: "",
    },
  },
  {
    name: "tracking/[id]",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak - sipariş takibi
      headerBackTitle: "",
    },
  },
  {
    name: "invoice-preview",
    options: {
      headerShown: true,
      headerTitle: "", // i18n ile dinamik olarak ayarlanacak
      headerBackTitle: "",
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
    backTitle: "", // iOS'ta geri butonunda yazı olmasın
    backButtonDisplayMode: "minimal" as const, // iOS'ta sadece ok işareti göster
  },
  headerTitleStyle: {
    fontWeight: "600" as const,
    fontSize: 17,
  },
} as const;
