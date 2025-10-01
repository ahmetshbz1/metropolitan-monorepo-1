import { Ionicons } from "@expo/vector-icons";
import { PaymentTermOption } from "@metropolitan/shared";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BaseCard } from "@/components/base/BaseCard";
import { useAuth } from "@/context/AuthContext";
import { useCheckout } from "@/context/CheckoutContext";
import { api } from "@/core/api";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";

export const PaymentTermSelector: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { state, setPaymentTermDays } = useCheckout();
  const { withHapticFeedback } = useHaptics();
  const [availableTerms, setAvailableTerms] = useState<PaymentTermOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPaymentTerms = async () => {
      if (user?.userType !== "corporate") return;
      if (state.selectedPaymentMethod?.id !== "bank_transfer") return;

      setLoading(true);
      try {
        const { data } = await api.get("/payment-terms/available", {
          params: { userId: user.id },
        });

        if (data.success && data.data) {
          setAvailableTerms(data.data);
          if (data.data.length > 0 && !state.paymentTermDays) {
            setPaymentTermDays(data.data[0].days);
          }
        }
      } catch (error) {
        setAvailableTerms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentTerms();
  }, [user?.id, user?.userType, state.selectedPaymentMethod?.id]);

  if (user?.userType !== "corporate") return null;
  if (state.selectedPaymentMethod?.id !== "bank_transfer") return null;
  if (availableTerms.length === 0 && !loading) return null;

  return (
    <BaseCard>
      <View className="flex-row items-center mb-3">
        <Ionicons name="time-outline" size={20} color={colors.tint} />
        <ThemedText className="text-base font-semibold ml-2">
          {t("checkout.payment_term.title")}
        </ThemedText>
      </View>

      {loading ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color={colors.tint} />
        </View>
      ) : (
        <View className="gap-3">
          {availableTerms.map((term) => {
            const isSelected = state.paymentTermDays === term.days;
            const isRecommended = term.days === 7;
            return (
              <Pressable
                key={term.days}
                onPress={withHapticFeedback(() => {
                  setPaymentTermDays(term.days);
                })}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  className="p-4 rounded-xl border-2 flex-row items-center justify-between"
                  style={{
                    backgroundColor: isSelected
                      ? `${colors.tint}10`
                      : colors.cardBackground,
                    borderColor: isSelected ? colors.tint : colors.border,
                  }}
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={24}
                      color={isSelected ? colors.tint : colors.border}
                      style={{ marginRight: 12 }}
                    />
                    <View className="flex-1">
                      <ThemedText
                        className="text-base font-semibold"
                        style={{
                          color: isSelected ? colors.tint : colors.text,
                        }}
                      >
                        {term.label}
                      </ThemedText>
                      {term.days === 0 && (
                        <ThemedText className="text-xs opacity-60 mt-0.5">
                          {t("checkout.payment_term.immediate_payment")}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  {isRecommended && (
                    <View
                      className="px-2 py-1 rounded-md"
                      style={{ backgroundColor: colors.success + "20" }}
                    >
                      <ThemedText
                        className="text-xs font-semibold"
                        style={{ color: colors.success }}
                      >
                        {t("checkout.payment_term.recommended")}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {state.paymentTermDays !== null && state.paymentTermDays > 0 && (
        <View className="mt-3 p-3 rounded-lg flex-row items-start" style={{ backgroundColor: `${colors.tint}08` }}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.tint}
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <ThemedText className="text-xs opacity-70 flex-1">
            {t("checkout.payment_term.info", { days: state.paymentTermDays })}
          </ThemedText>
        </View>
      )}
    </BaseCard>
  );
};
