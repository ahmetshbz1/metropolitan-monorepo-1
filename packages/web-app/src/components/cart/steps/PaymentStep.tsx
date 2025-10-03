"use client";

import { Button } from "@/components/ui/button";
import { useCheckout } from "@/context/CheckoutContext";
import { Icon } from "@iconify/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PaymentStep() {
  const { t } = useTranslation();
  const { state, setPaymentMethod, nextStep, canProceedToNext } = useCheckout();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-base">{t("payment.select_title")}</h3>
      </div>

      {/* Payment Methods Grid */}
      <div className="overflow-y-auto flex-1 min-h-0 px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`
                group relative p-3 rounded-lg border-2 cursor-pointer transition-all
                ${
                  state.selectedPaymentMethod?.id === method.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:shadow-md hover:scale-[1.02]"
                }
              `}
              onClick={() => setPaymentMethod(method)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${
                      state.selectedPaymentMethod?.id === method.id
                        ? "bg-primary/10"
                        : "bg-muted"
                    }
                  `}
                >
                  <Icon
                    icon={method.icon}
                    className={`w-5 h-5 ${
                      state.selectedPaymentMethod?.id === method.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-0.5">{method.title}</h4>
                  {method.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{method.subtitle}</p>
                  )}
                </div>

                {/* Check Mark */}
                {state.selectedPaymentMethod?.id === method.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3 flex-shrink-0 bg-background">
        <Button onClick={nextStep} size="lg" className="w-full" disabled={!canProceedToNext()}>
          {t("cart.actions.continue")}
        </Button>
      </div>
    </div>
  );
}