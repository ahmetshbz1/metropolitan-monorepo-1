//  "addresses.tsx"
//  metropolitan app
//  Created by Ahmet on 02.07.2025.

import { useRouter, useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddressCard } from "@/components/addresses/AddressCard";
import { EmptyAddresses } from "@/components/addresses/EmptyAddresses";
import { BaseButton } from "@/components/base/BaseButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAddresses } from "@/context/AddressContext";
import type { Address } from "@metropolitan/shared";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function AddressesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("addresses.title"),
    });
  }, [navigation, t]);

  const { addresses, loading, error } = useAddresses();

  const handleAddAddress = () => {
    router.push("/add-address");
  };

  const ListFooter = () => (
    <BaseButton
      variant="secondary"
      size="small"
      title={`+ ${t("addresses.add_new_address")}`}
      onPress={handleAddAddress}
      style={{ marginTop: 16 }}
    />
  );

  if (loading) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText>{t("addresses.error_loading")}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      {addresses.length === 0 ? (
        <EmptyAddresses />
      ) : (
        <FlatList
          data={addresses}
          renderItem={({ item }) => <AddressCard address={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: safeAreaInsets.bottom + 16,
          }}
          ListFooterComponent={ListFooter}
        />
      )}
    </ThemedView>
  );
}
