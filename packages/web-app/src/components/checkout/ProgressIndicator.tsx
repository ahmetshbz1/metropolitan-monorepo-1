"use client";

import { Check } from "lucide-react";
import { useCheckout, type CheckoutStep } from "@/context/CheckoutContext";

const STEPS: { id: CheckoutStep; label: string; number: number }[] = [
  { id: "cart", label: "Sepet", number: 1 },
  { id: "address", label: "Adres", number: 2 },
  { id: "payment", label: "Ödeme", number: 3 },
  { id: "summary", label: "Özet", number: 4 },
];

export function ProgressIndicator() {
  const { state } = useCheckout();
  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep);

  return (
    <div className="px-6 py-4 border-b bg-background">
      <div className="flex items-center justify-center gap-2 max-w-3xl mx-auto">
        {STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center min-w-[60px]">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span
                  className={`
                    text-xs font-medium mt-2 transition-colors whitespace-nowrap
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
                    h-0.5 w-12 sm:w-16 md:w-20 mx-2 transition-colors
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