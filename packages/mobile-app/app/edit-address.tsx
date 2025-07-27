// "edit-address.tsx"
// metropolitan app
// Created by Ahmet on 21.06.2025, last modified on 15.07.2025.

import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
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
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/useToast";

export default function EditAddressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { addresses, updateAddress } = useAddresses();
  const { addressId } = useLocalSearchParams<{ addressId: string }>();
  const { withHapticFeedback } = useHaptics();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState<AddressFormData>({
    addressTitle: "",
    street: "",
    city: "",
    postalCode: "",
    country: "Poland",
  });
  const [loading, setLoading] = useState(false);

  // Header title'ı dinamik olarak ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("edit_address.title"),
    });
  }, [navigation, t]);

  useEffect(() => {
    const addressToEdit = addresses.find((addr) => addr.id === addressId);
    if (addressToEdit) {
      setFormData(addressToEdit);
    }
  }, [addressId, addresses]);

  const handleUpdateAddress = async () => {
    const { addressTitle, street, city, postalCode } = formData;
    if (!addressTitle || !street || !city || !postalCode) {
      showToast(t("edit_address.form.error_message"), "warning");
      return;
    }

    if (!addressId) return;

    setLoading(true);
    try {
      await updateAddress(addressId, formData);
      showToast(t("edit_address.form.update_success_message"), "success");
      router.back();
    } catch (error) {
      showToast(t("edit_address.form.submit_error_message"), "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof AddressFormData, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
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
            title={t("edit_address.form.save_button")}
            onPress={withHapticFeedback(handleUpdateAddress)}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}
