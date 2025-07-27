//  "add-address.tsx"
//  metropolitan app
//  Created by Ahmet on 26.06.2025.

import { useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AddressForm,
  AddressFormData,
} from "@/components/addresses/AddressForm";
import { BaseButton } from "@/components/base/BaseButton";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAddresses } from "@/context/AddressContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useToast } from "@/hooks/useToast";

export default function AddAddressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { addAddress } = useAddresses();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState<AddressFormData>({
    addressTitle: "",
    street: "",
    city: "",
    postalCode: "",
    country: "Poland",
  });

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("add_address.title"),
    });
  }, [navigation, t]);

  const [loading, setLoading] = useState(false);

  const handleFormChange = (field: keyof AddressFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = async () => {
    const { addressTitle, street, city, postalCode } = formData;
    if (!addressTitle || !street || !city || !postalCode) {
      showToast(t("add_address.form.error_message"), "warning");
      return;
    }

    setLoading(true);
    try {
      await addAddress({
        ...formData,
        userId: "", // This will be set on the backend
        isDefaultDelivery: false,
        isDefaultBilling: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      showToast(t("add_address.form.success_message"), "success");
      router.back();
    } catch (error) {
      showToast(t("add_address.form.submit_error_message"), "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 0,
        }}
        bottomOffset={200}
        extraKeyboardSpace={0}
      >
        <AddressForm formData={formData} onFormChange={handleFormChange} />
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View
          className="p-5"
          style={{
            backgroundColor: colors.background,
            paddingBottom: insets.bottom || 20,
          }}
        >
          <BaseButton
            variant="primary"
            size="small"
            title={t("add_address.form.save_button")}
            onPress={handleAddAddress}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}
