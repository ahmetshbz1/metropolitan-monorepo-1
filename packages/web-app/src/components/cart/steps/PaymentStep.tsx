"use client";

import { Button } from "@/components/ui/button";
import { useCheckout } from "@/context/CheckoutContext";
import { Icon } from "@iconify/react";
import { Check } from "lucide-react";

export function PaymentStep() {
  const { state, setPaymentMethod, nextStep, canProceedToNext } = useCheckout();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Payment Methods */}
      <div className="overflow-y-auto flex-1 min-h-0 px-6 py-4 space-y-4">
        <h3 className="font-semibold mb-4">Ödeme Yöntemi Seçin</h3>

        {state.paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-colors
              ${
                state.selectedPaymentMethod?.id === method.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }
            `}
            onClick={() => setPaymentMethod(method)}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${
                  state.selectedPaymentMethod?.id === method.id
                    ? "bg-primary/10"
                    : "bg-muted"
                }
              `}
              >
                <Icon
                  icon={method.icon}
                  className={`w-6 h-6 ${
                    state.selectedPaymentMethod?.id === method.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{method.title}</h4>
                {method.subtitle && (
                  <p className="text-sm text-muted-foreground">{method.subtitle}</p>
                )}
              </div>

              {/* Check Mark */}
              {state.selectedPaymentMethod?.id === method.id && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 flex-shrink-0 bg-background">
        <Button onClick={nextStep} size="lg" className="w-full" disabled={!canProceedToNext()}>
          Devam Et
        </Button>
      </div>
    </div>
  );
}