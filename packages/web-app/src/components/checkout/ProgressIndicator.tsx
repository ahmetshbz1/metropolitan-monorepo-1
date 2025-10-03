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
    <div className="px-6 py-4 bg-muted/30">
      <div className="flex items-center justify-center gap-2 max-w-3xl mx-auto">
        {STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm
                    ${
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-primary/20"
                        : isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-primary/20"
                        : "bg-background text-muted-foreground border-2 border-muted"
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span
                  className={`
                    text-[11px] sm:text-xs font-medium mt-2 transition-colors whitespace-nowrap
                    ${isActive || isCompleted ? "text-foreground font-semibold" : "text-muted-foreground"}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 px-2 pb-8">
                  <div
                    className={`
                      h-1 w-full rounded-full transition-all duration-300
                      ${isCompleted ? "bg-primary" : "bg-muted"}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}