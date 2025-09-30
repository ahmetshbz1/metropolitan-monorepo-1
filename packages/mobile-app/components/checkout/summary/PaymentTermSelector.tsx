import { Ionicons } from "@expo/vector-icons";
import { PaymentTermOption } from "@metropolitan/shared";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BaseCard } from "@/components/base/BaseCard";
import { useAuth } from "@/context/AuthContext";
import { useCheckout } from "@/context/CheckoutContext";
import { api } from "@/core/api";
import { useTheme } from "@/hooks/useTheme";

export const PaymentTermSelector: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { state, setPaymentTermDays } = useCheckout();
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
  }, [user?.id, user?.userType, state.selectedPaymentMethod?.id, setPaymentTermDays, state.paymentTermDays]);

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
        <View className="flex-row flex-wrap gap-2">
          {availableTerms.map((term) => {
            const isSelected = state.paymentTermDays === term.days;
            return (
              <TouchableOpacity
                key={term.days}
                onPress={() => setPaymentTermDays(term.days)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: isSelected ? `${colors.tint}15` : colors.cardBackground,
                  borderColor: isSelected ? colors.tint : colors.border,
                }}
              >
                <ThemedText
                  className="text-sm font-semibold"
                  style={{
                    color: isSelected ? colors.tint : colors.text,
                  }}
                >
                  {term.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {state.paymentTermDays && (
        <View className="mt-3 p-3 rounded-lg" style={{ backgroundColor: `${colors.tint}10` }}>
          <ThemedText className="text-xs opacity-70">
            {t("checkout.payment_term.info", { days: state.paymentTermDays })}
          </ThemedText>
        </View>
      )}
    </BaseCard>
  );
};
