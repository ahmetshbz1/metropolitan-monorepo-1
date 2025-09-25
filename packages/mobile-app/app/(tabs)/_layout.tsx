//  "_layout.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { useContext, useMemo, useLayoutEffect } from "react";
import { useNavigation, useRoute, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { useTabScreenOptions } from "@/components/tabs/TabScreenOptions";
import { TabScreens } from "@/components/tabs/TabScreens";
import { ProductsSearchProvider } from "@/context/ProductsSearchContext";
import { ScrollToTopProvider } from "@/context/ScrollToTopContext";
import { CartContext } from "@/context/CartContext";
import { useTabLayout } from "@/hooks/useTabLayout";

export default function TabLayout() {
  const { cartItems } = useContext(CartContext);
  const cartItemCount = cartItems.length;
  const navigation = useNavigation();
  const route = useRoute();
  const { t, i18n } = useTranslation();

  const {
    scrollToTop,
    registerScrollHandler,
    unregisterScrollHandler,
    handleClearCart,
    handleNotification,
    getTabBarHeight,
    getTabBarPaddingBottom,
  } = useTabLayout();

  const screenOptions = useTabScreenOptions(
    getTabBarHeight,
    getTabBarPaddingBottom
  );

  // Memoize screenOptions to prevent re-renders
  const memoizedScreenOptions = useMemo(() => screenOptions, [screenOptions]);

  // Set dynamic title based on focused tab
  useLayoutEffect(() => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? "index";

    let title = "";
    switch (routeName) {
      case "index":
        title = t("tabs.home");
        break;
      case "products":
        title = t("tabs.products");
        break;
      case "cart":
        title = t("tabs.cart.title");
        break;
      case "orders":
        title = t("tabs.orders");
        break;
      case "profile":
        title = t("tabs.profile");
        break;
      default:
        title = t("tabs.home");
    }

    navigation.setOptions({
      title: title,
      // iOS back button title persistence önleme - güçlendirilmiş ayarlar
      headerBackTitle: "",
      headerBackTitleVisible: false,
      headerBackButtonDisplayMode: "minimal" as const,
      // iOS-specific ek ayarlar
      ...(Platform.OS === 'ios' && {
        headerBackTitleStyle: { fontSize: 0 },
        headerBackButtonMenuEnabled: false,
      }),
    } as any);
  }, [navigation, route, t, i18n.language]);

  return (
    <ProductsSearchProvider>
      <ScrollToTopProvider
        scrollToTop={scrollToTop}
        registerScrollHandler={registerScrollHandler}
        unregisterScrollHandler={unregisterScrollHandler}
      >
        <TabScreens
          key={i18n.language}
          cartItemCount={cartItemCount}
          handleClearCart={handleClearCart}
          handleNotification={handleNotification}
          scrollToTop={scrollToTop}
          screenOptions={memoizedScreenOptions}
        />
      </ScrollToTopProvider>
    </ProductsSearchProvider>
  );
}

// Re-export contexts for backward compatibility
export { useProductsSearch } from "@/context/ProductsSearchContext";
export { useScrollToTop } from "@/context/ScrollToTopContext";
