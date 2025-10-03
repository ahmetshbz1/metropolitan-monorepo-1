"use client";

import { Check } from "lucide-react";
import { useCheckout, type CheckoutStep } from "@/context/CheckoutContext";
import { useTranslation } from "react-i18next";

export function ProgressIndicator() {
  const { t } = useTranslation();
  const { state } = useCheckout();
  
  const STEPS: { id: CheckoutStep; label: string; number: number }[] = [
    { id: "cart", label: t("checkout.steps.cart"), number: 1 },
    { id: "address", label: t("checkout.steps.address"), number: 2 },
    { id: "payment", label: t("checkout.steps.payment"), number: 3 },
    { id: "summary", label: t("checkout.steps.summary"), number: 4 },
  ];
  
  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep);

  return (
    <div className="px-4 py-3 border-b bg-background">
      <div className="flex items-center justify-center gap-1.5 max-w-2xl mx-auto">
        {STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center min-w-[44px] sm:min-w-[52px]">
                <div
                  className={`
                    w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                    ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>
                <span
                  className={`
                    text-[10px] sm:text-xs font-medium mt-1 transition-colors whitespace-nowrap
                    ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`
                    h-0.5 w-6 sm:w-10 md:w-12 mx-1 sm:mx-1.5 transition-colors
                    ${isCompleted ? "bg-primary" : "bg-muted"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}