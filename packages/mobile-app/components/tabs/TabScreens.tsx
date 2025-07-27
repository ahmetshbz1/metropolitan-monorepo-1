//  "TabScreens.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { HapticIconButton } from "@/components/HapticButton";
import { SearchInput } from "@/components/appbar/SearchInput";
import { useProductsSearch } from "@/context/ProductsSearchContext";
import { useTheme } from "@/hooks/useTheme";

interface TabScreensProps {
  cartItemCount: number;
  handleClearCart: () => void;
  handleNotification: () => void;
  scrollToTop: (routeName: string) => void;
  screenOptions: any;
}

export const TabScreens = ({
  cartItemCount,
  handleClearCart,
  handleNotification,
  scrollToTop,
  screenOptions,
}: TabScreensProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { searchQuery, setSearchQuery } = useProductsSearch();

  return (
    <Tabs
      screenOptions={screenOptions}
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
                hapticType="light"
                style={{ padding: 8 }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.text}
                />
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
              <HapticIconButton
                onPress={handleNotification}
                hapticType="light"
                style={{ padding: 8 }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.text}
                />
              </HapticIconButton>
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
                  <TouchableOpacity
                    onPress={handleClearCart}
                    style={{ padding: 8, marginRight: 4 }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={24}
                      color={colors.text}
                    />
                  </TouchableOpacity>
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
};