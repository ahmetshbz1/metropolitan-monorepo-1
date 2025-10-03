"use client";

import { ProgressIndicator } from "@/components/checkout/ProgressIndicator";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] max-h-[80vh] min-h-[80vh] flex flex-col">
        {/* Header */}
        <DrawerHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                {state.currentStep === "cart" ? (
                  <X className="h-5 w-5" />
                ) : (
                  <ArrowLeft className="h-5 w-5" />
                )}
              </Button>
              <DrawerTitle className="text-xl font-bold">
                {getStepTitle()}
              </DrawerTitle>
            </div>
          </div>
        </DrawerHeader>

        {/* Progress Indicator */}
        <div className="flex-shrink-0">
          <ProgressIndicator />
        </div>

        {/* Step Content */}
        <DrawerBody className="flex flex-col flex-1 overflow-hidden p-0">
          {getStepComponent()}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
