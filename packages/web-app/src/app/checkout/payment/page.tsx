"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore, useCartStore } from "@/stores";
import { CreditCard, Building2, Check, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useCheckout } from "@/context/CheckoutContext";

export default function CheckoutPaymentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const { items } = useCartStore();
  const { state, setPaymentMethod } = useCheckout();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      router.push("/auth/phone-login");
      return;
    }

    if (items.length === 0) {
      router.push("/cart");
      return;
    }

    setLoading(false);
  }, [accessToken, items, router]);

  // Available payment methods based on user type
  const paymentMethods = [
    {
      id: "card",
      icon: CreditCard,
      title: t("checkout.payment_methods.card.title"),
      subtitle: t("checkout.payment_methods.card.subtitle"),
      isAvailable: true,
    },
    {
      id: "blik",
      icon: Smartphone,
      title: "BLIK",
      subtitle: "Hızlı mobil ödeme",
      isAvailable: true,
    },
    {
      id: "bank_transfer",
      icon: Building2,
      title: t("checkout.payment_methods.bank_transfer.title"),
      subtitle: t("checkout.payment_methods.bank_transfer.subtitle"),
      isAvailable: user?.userType === "corporate",
    },
  ].filter(method => method.isAvailable);

  const handleContinue = () => {
    if (!selectedPaymentMethod) {
      alert(t("checkout.no_payment_method_selected"));
      return;
    }

    // Set payment method in checkout context
    const selectedMethod = state.paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod) {
      setPaymentMethod(selectedMethod);
    }

    router.push("/checkout/summary");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-48 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <span className="text-muted-foreground">
            1. {t("checkout.steps.address")}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-primary font-medium">
            2. {t("checkout.steps.payment")}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">
            3. {t("checkout.steps.summary")}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-8">
          {t("checkout.payment_method")}
        </h1>

        {/* Security Badge */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                {t("checkout.secure_payment")}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {t("checkout.secure_payment_desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-8">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPaymentMethod(method.id)}
              className={`w-full text-left bg-card rounded-xl border-2 p-6 transition-colors ${
                selectedPaymentMethod === method.id
                  ? "border-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <method.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{method.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {method.subtitle}
                  </p>
                </div>
                {selectedPaymentMethod === method.id && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-xl p-4 mb-8">
          <p className="text-sm text-muted-foreground text-center">
            {paymentMethods.length} ödeme yöntemi mevcut
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Geri
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1"
            disabled={!selectedPaymentMethod}
          >
            {t("checkout.continue_to_summary")}
          </Button>
        </div>
      </div>
    </div>
  );
}
