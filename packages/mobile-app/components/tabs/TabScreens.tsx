//  "TabScreens.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet } from "react-native";

import { HapticIconButton } from "@/components/HapticButton";
import { SearchInput } from "@/components/appbar/SearchInput";
import { useProductsSearch } from "@/context/ProductsSearchContext";
import { useNotifications } from "@/context/NotificationContext";
import { useTheme } from "@/hooks/useTheme";

interface TabScreensProps {
  cartItemCount: number;
  handleClearCart: () => void;
  handleNotification: () => void;
  scrollToTop: (routeName: string) => void;
  screenOptions: any;
}

export const TabScreens = memo(({
  cartItemCount,
  handleClearCart,
  handleNotification,
  scrollToTop,
  screenOptions,
}: TabScreensProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { searchQuery, setSearchQuery } = useProductsSearch();
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        ...screenOptions,
        // Lazy render to avoid mounting all tabs; improves theme toggle performance
        lazy: true,
        animation: "shift", // Daha hızlı animasyon
      }}
      screenListeners={({ navigation, route }) => ({
        tabPress: () => {
          const currentRoute =
            navigation.getState().routes[navigation.getState().index];
          if (
            currentRoute.name === route.name &&
            (route.name === "index" || route.name === "products")
          ) {
            scrollToTop(route.name);
          }
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          headerShown: true,
          headerTitle: t("tabs.home"),
          headerRight: () => (
            <View style={{ flexDirection: "row", marginRight: 4 }}>
              <HapticIconButton
                onPress={handleNotification}
                style={{ padding: 8, position: "relative" }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.text}
                />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </HapticIconButton>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t("tabs.products"),
          headerShown: true,
          headerTitle: t("tabs.products"),
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 4,
              }}
            >
              <SearchInput
                onSearchChange={setSearchQuery}
                initialValue={searchQuery}
                placeholder="Ürün ara..."
              />
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "bag" : "bag-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("tabs.cart.title"),
          headerShown: true,
          headerTitle: t("tabs.cart.title"),
          headerRight:
            cartItemCount > 0
              ? () => (
                  <HapticIconButton
                    onPress={handleClearCart}
                    style={{ padding: 8, marginRight: 4 }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={24}
                      color={colors.text}
                    />
                  </HapticIconButton>
                )
              : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "cart" : "cart-outline"}
              color={color}
            />
          ),
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t("tabs.orders"),
          headerShown: true,
          headerTitle: t("tabs.orders"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "receipt" : "receipt-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          headerShown: true,
          headerTitle: t("tabs.profile"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "person" : "person-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
});

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FF3B30", // iOS kırmızısı
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
