//  "orders.tsx"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedView } from "@/components/ThemedView";
import { EmptyOrders } from "@/components/orders/EmptyOrders";
import { OrderCard } from "@/components/orders/OrderCard";
import { ErrorState } from "@/components/ui/ErrorState";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useFocusEffect } from "expo-router";

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { paddingBottom } = useTabBarHeight();
  const { isGuest } = useAuth();
  const { orders, loading, error, fetchOrders, refreshOrders } = useOrders();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  useFocusEffect(
    useCallback(() => {
      // Misafir kullanıcı değilse siparişleri getir
      if (!isGuest) {
        fetchOrders(); // Use cache if available
      }
    }, [fetchOrders, isGuest])
  );

  const handleRefresh = useCallback(() => {
    // Misafir kullanıcı değilse refresh yap
    if (!isGuest) {
      return refreshOrders(); // Force refresh
    }
    return Promise.resolve(); // Misafir kullanıcı için boş promise
  }, [refreshOrders, isGuest]);

  // Misafir kullanıcı için direkt EmptyOrders göster
  if (isGuest) {
    return (
      <ThemedView className="flex-1">
        <EmptyOrders />
      </ThemedView>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error && orders.length === 0) {
    return (
      <ErrorState
        message={t("orders.load_error")}
        onRetry={() => fetchOrders(true)}
      />
    );
  }

  return (
    <ThemedView className="flex-1">
      {orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{
            paddingBottom: paddingBottom,
            paddingTop: 10,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
            />
          }
        >
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}
