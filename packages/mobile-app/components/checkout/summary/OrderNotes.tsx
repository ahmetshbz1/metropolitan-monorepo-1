//  "OrderNotes.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";

interface OrderNotesProps {
  onFocus?: () => void;
  onBlur?: () => void;
}

export function OrderNotes({ onFocus, onBlur }: OrderNotesProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { state, setNotes } = useCheckout();
  const { withHapticFeedback } = useHaptics();

  return (
    <View style={{ marginBottom: 20 }}>
      <ThemedText className="text-base font-semibold mb-3">
        {t("checkout.order_notes")}
      </ThemedText>
      <View style={{ position: "relative" }}>
        <TextInput
          style={{
            backgroundColor: colors.card,
            color: colors.text,
            height: 100,
            padding: 16,
            borderRadius: 12,
            textAlignVertical: "top",
            fontSize: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
            paddingRight: state.notes ? 40 : 16,
          }}
          placeholder={t("checkout.order_notes_placeholder")}
          placeholderTextColor={colors.mediumGray}
          multiline
          value={state.notes}
          onChangeText={setNotes}
          onFocus={onFocus}
          onBlur={onBlur}
          accessibilityLabel={t("checkout.order_notes")}
        />
        {state.notes ? (
          <Pressable
            onPress={withHapticFeedback(() => setNotes(""))}
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              zIndex: 10,
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("common.clear")}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color={colors.mediumGray} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
