//  "useTabLayout.ts"
//  metropolitan app
//  Created by Ahmet on 03.07.2025.

import { CartContext } from "@/context/CartContext";
import { router } from "expo-router";
import { useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useTabLayout = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { clearCart } = useContext(CartContext);
  const scrollHandlers = useRef<Record<string, () => void>>({});

  const scrollToTop = (routeName: string) => {
    const handler = scrollHandlers.current[routeName];
    if (handler) {
      handler();
    }
  };

  const registerScrollHandler = (routeName: string, handler: () => void) => {
    scrollHandlers.current[routeName] = handler;
  };

  const unregisterScrollHandler = (routeName: string) => {
    delete scrollHandlers.current[routeName];
  };

  const handleClearCart = () => {
    Alert.alert(
      t("tabs.cart.clear_alert_title"),
      t("tabs.cart.clear_alert_message"),
      [
        {
          text: t("tabs.cart.clear_alert_cancel"),
          style: "cancel",
        },
        {
          text: t("tabs.cart.clear_alert_confirm"),
          onPress: clearCart,
          style: "destructive",
        },
      ]
    );
  };

  const handleNotification = () => {
    router.push("/notifications");
  };

  const getTabBarHeight = () => {
    if (Platform.OS === "ios") {
      return 75;
    } else {
      return 70 + Math.max(insets.bottom - 10, 8);
    }
  };

  const getTabBarPaddingBottom = () => {
    if (Platform.OS === "ios") {
      return 16;
    } else {
      return Math.max(insets.bottom - 4, 16);
    }
  };

  return {
    scrollToTop,
    registerScrollHandler,
    unregisterScrollHandler,
    handleClearCart,
    handleNotification,
    getTabBarHeight,
    getTabBarPaddingBottom,
  };
};
