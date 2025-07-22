//  "orders.tsx"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, ScrollView } from "react-native";

import { ThemedView } from "@/components/ThemedView";
import { EmptyOrders } from "@/components/orders/EmptyOrders";
import { OrderCard } from "@/components/orders/OrderCard";
import { ErrorState } from "@/components/ui/ErrorState";
import Colors from "@/constants/Colors";
import { useOrders } from "@/context/OrderContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useFocusEffect } from "expo-router";

export default function OrdersScreen() {
  const { paddingBottom } = useTabBarHeight();
  const { orders, loading, error, fetchOrders, refreshOrders } = useOrders();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  useFocusEffect(
    useCallback(() => {
      fetchOrders(); // Use cache if available
    }, [fetchOrders])
  );

  const handleRefresh = useCallback(() => {
    return refreshOrders(); // Force refresh
  }, [refreshOrders]);

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
        message="Siparişlerinizi yüklerken bir hata oluştu."
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
