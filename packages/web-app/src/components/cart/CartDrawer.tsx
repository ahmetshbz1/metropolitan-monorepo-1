"use client";

import { ProgressIndicator } from "@/components/checkout/ProgressIndicator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCheckout } from "@/context/CheckoutContext";
import { useCartStore } from "@/stores/cart-store";
import { ArrowLeft, X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Step Components
import { AddressStep } from "./steps/AddressStep";
import { CartStep } from "./steps/CartStep";
import { PaymentStep } from "./steps/PaymentStep";
import { SummaryStep } from "./steps/SummaryStep";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { t } = useTranslation();
  const { state, nextStep, prevStep, canProceedToNext, resetCheckout } =
    useCheckout();
  const items = useCartStore((state) => state.items);

  // Drawer kapandığında checkout'u resetle
  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        resetCheckout();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open, resetCheckout]);

  const handleBack = () => {
    if (state.currentStep === "cart") {
      onOpenChange(false);
    } else {
      prevStep();
    }
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      nextStep();
    }
  };

  const getStepTitle = () => {
    switch (state.currentStep) {
      case "cart":
        return t("cart.title");
      case "address":
        return t("checkout.delivery_address");
      case "payment":
        return t("checkout.payment_method");
      case "summary":
        return t("checkout.order_summary");
      default:
        return t("cart.title");
    }
  };

  const getStepComponent = () => {
    switch (state.currentStep) {
      case "cart":
        return (
          <CartStep
            onNext={handleNext}
            canProceed={items.length > 0}
            onClose={() => onOpenChange(false)}
          />
        );
      case "address":
        return <AddressStep />;
      case "payment":
        return <PaymentStep />;
      case "summary":
        return <SummaryStep onComplete={() => onOpenChange(false)} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100vw-0.5rem)] md:max-w-[calc(100vw-1rem)] lg:max-w-[calc(100vw-1.5rem)] h-[calc(100vh-0.5rem)] md:h-[calc(100vh-1rem)] lg:h-[calc(100vh-1.5rem)] flex flex-col p-0 gap-0 overflow-hidden rounded-xl md:rounded-2xl shadow-2xl"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="border-b flex-shrink-0 px-6 py-4 bg-background/95 backdrop-blur-xl rounded-t-xl md:rounded-t-2xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="flex-shrink-0"
            >
              {state.currentStep === "cart" ? (
                <X className="h-5 w-5" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
            </Button>
            <DialogTitle className="text-xl font-bold">
              {getStepTitle()}
            </DialogTitle>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4">
            <ProgressIndicator />
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {getStepComponent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
