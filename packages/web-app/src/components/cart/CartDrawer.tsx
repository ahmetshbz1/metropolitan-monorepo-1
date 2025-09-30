"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { X, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useCheckout } from "@/context/CheckoutContext";
import { ProgressIndicator } from "@/components/checkout/ProgressIndicator";

// Step Components
import { CartStep } from "./steps/CartStep";
import { AddressStep } from "./steps/AddressStep";
import { PaymentStep } from "./steps/PaymentStep";
import { SummaryStep } from "./steps/SummaryStep";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { state, nextStep, prevStep, canProceedToNext, resetCheckout } = useCheckout();
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
        return "Sepetim";
      case "address":
        return "Teslimat Adresi";
      case "payment":
        return "Ödeme Yöntemi";
      case "summary":
        return "Sipariş Özeti";
      default:
        return "Sepetim";
    }
  };

  const getStepComponent = () => {
    switch (state.currentStep) {
      case "cart":
        return <CartStep onNext={handleNext} canProceed={items.length > 0} />;
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
      <DrawerContent className="max-h-[90vh] flex flex-col">
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
              <DrawerTitle className="text-xl font-bold">{getStepTitle()}</DrawerTitle>
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