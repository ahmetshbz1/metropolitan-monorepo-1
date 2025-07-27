//  "_layout.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { useContext, useMemo } from "react";

import { useTabScreenOptions } from "@/components/tabs/TabScreenOptions";
import { TabScreens } from "@/components/tabs/TabScreens";
import { ProductsSearchProvider } from "@/context/ProductsSearchContext";
import { ScrollToTopProvider } from "@/context/ScrollToTopContext";
import { CartContext } from "@/context/CartContext";
import { useTabLayout } from "@/hooks/useTabLayout";

export default function TabLayout() {
  const { cartItems } = useContext(CartContext);
  const cartItemCount = cartItems.length;

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

  return (
    <ProductsSearchProvider>
      <ScrollToTopProvider
        scrollToTop={scrollToTop}
        registerScrollHandler={registerScrollHandler}
        unregisterScrollHandler={unregisterScrollHandler}
      >
        <TabScreens
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
