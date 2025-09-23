//  "AddressForm.tsx"
//  metropolitan app
//  Created by Ahmet on 06.07.2025.
//  Updated on 23.09.2025 to fix BaseInput usage

import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { BaseInput } from "@/components/base/BaseInput";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export interface AddressFormData {
  addressTitle: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface AddressFormProps {
  formData: AddressFormData;
  onFormChange: (field: keyof AddressFormData, value: string) => void;
}

export function AddressForm({
  formData,
  onFormChange,
}: AddressFormProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View style={{ gap: 12 }}>
      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("add_address.form.address_title")}
        </ThemedText>
        <BaseInput
          value={formData.addressTitle}
          onChangeText={(value) => onFormChange("addressTitle", value)}
          placeholder={t("add_address.form.address_title_placeholder")}
          placeholderTextColor={colors.mediumGray}
          size="small"
          variant="default"
        />
      </View>

      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("add_address.form.street")}
        </ThemedText>
        <BaseInput
          value={formData.street}
          onChangeText={(value) => onFormChange("street", value)}
          placeholder={t("add_address.form.street_placeholder")}
          placeholderTextColor={colors.mediumGray}
          size="small"
          variant="default"
        />
      </View>

      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("add_address.form.city")}
        </ThemedText>
        <BaseInput
          value={formData.city}
          onChangeText={(value) => onFormChange("city", value)}
          placeholder={t("add_address.form.city_placeholder")}
          placeholderTextColor={colors.mediumGray}
          size="small"
          variant="default"
        />
      </View>

      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("add_address.form.postal_code")}
        </ThemedText>
        <BaseInput
          value={formData.postalCode}
          onChangeText={(value) => onFormChange("postalCode", value)}
          placeholder={t("add_address.form.postal_code_placeholder")}
          placeholderTextColor={colors.mediumGray}
          keyboardType="numeric"
          size="small"
          variant="default"
        />
      </View>

      <View>
        <ThemedText className="text-sm mb-2 font-medium opacity-80">
          {t("add_address.form.country")}
        </ThemedText>
        <BaseInput
          value={formData.country}
          editable={false}
          disabled
          size="small"
          variant="default"
        />
      </View>
    </View>
  );
}