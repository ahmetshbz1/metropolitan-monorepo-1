//  "SummaryFooter.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BaseButton } from "@/components/base/BaseButton";
import Colors from "@/constants/Colors";
import { useCheckout } from "@/context/CheckoutContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TermsAgreement } from "./TermsAgreement";

interface SummaryFooterProps {
  isBankTransfer: boolean;
  isCreatingOrder: boolean;
  orderLoading: boolean;
  onPress: () => void;
}

export function SummaryFooter({
  isBankTransfer,
  isCreatingOrder,
  orderLoading,
  onPress,
}: SummaryFooterProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { state } = useCheckout();

  return (
    <KeyboardStickyView>
      <View
        className="px-5 pt-3 pb-3 gap-2"
        style={{
          backgroundColor: colors.background,
          paddingBottom: insets.bottom || 12,
        }}
      >
        <TermsAgreement />
        <BaseButton
          variant="primary"
          size="medium"
          title={
            isBankTransfer
              ? t("checkout.confirm_and_proceed")
              : t("checkout.complete_order")
          }
          onPress={onPress}
          loading={isCreatingOrder || orderLoading}
          disabled={!state.agreedToTerms || isCreatingOrder || orderLoading}
          fullWidth
        />
      </View>
    </KeyboardStickyView>
  );
}
