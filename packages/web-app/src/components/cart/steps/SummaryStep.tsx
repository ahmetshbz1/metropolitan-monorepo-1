"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCheckout } from "@/context/CheckoutContext";
import { useCartStore } from "@/stores/cart-store";
import { MapPin, CreditCard, Package } from "lucide-react";
import { useState } from "react";
import { useOrders } from "@/hooks/use-orders";
import { useStripePayment } from "@/hooks/use-stripe-payment";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

interface SummaryStepProps {
  onComplete: () => void;
}

export function SummaryStep({ onComplete }: SummaryStepProps) {
  const { state, setAgreedToTerms, setNotes, canProceedToNext, resetCheckout } = useCheckout();
  const items = useCartStore((state) => state.items);
  const summary = useCartStore((state) => state.summary);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();
  const { createOrder, loading: orderLoading } = useOrders();
  const { processPayment, loading: paymentLoading } = useStripePayment();
  const router = useRouter();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleCompleteOrder = async () => {
    if (!canProceedToNext() || !state.deliveryAddress || !state.selectedPaymentMethod) {
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = {
        shippingAddressId: state.deliveryAddress.id,
        billingAddressId: state.billingAddressSameAsDelivery
          ? state.deliveryAddress.id
          : state.billingAddress?.id,
        paymentMethodId: state.selectedPaymentMethod.id,
        notes: state.notes || undefined,
      };

      console.log("🛒 Starting order creation with data:", orderData);

      // Sipariş oluştur (mobile-app ile aynı flow)
      const orderResponse = await createOrder(orderData);

      console.log("📦 Order response received:", orderResponse);

      if (!orderResponse || !orderResponse.order) {
        throw new Error(t("order.creation_failed"));
      }

      const { order } = orderResponse;

      // Stripe Checkout URL kontrolü (Web için - Card ve BLIK)
      if (order.stripeCheckoutUrl) {
        console.log("🌐 Redirecting to Stripe Checkout:", order.stripeCheckoutUrl);

        // Stripe Checkout'a yönlendir
        window.location.href = order.stripeCheckoutUrl;
        return;
      }

      // Stripe ödeme kontrolü (Mobile için - Payment Intent)
      const isStripePayment = ["apple_pay", "google_pay"].includes(
        state.selectedPaymentMethod.id
      );

      console.log("💳 Payment method:", state.selectedPaymentMethod.id, "Is Stripe:", isStripePayment);

      if (isStripePayment && order.stripeClientSecret) {
        console.log("🔐 Processing Stripe payment with clientSecret");

        // Stripe ile ödeme işlemi
        const paymentResult = await processPayment(
          order.stripeClientSecret,
          state.selectedPaymentMethod.id
        );

        if (!paymentResult.success) {
          console.error("❌ Payment failed:", paymentResult.error);
          throw new Error(paymentResult.error || t("checkout.payment_error"));
        }

        console.log("✅ Payment successful");

        // Ödeme başarılı
        await clearCart();
        resetCheckout();
        onComplete();

        // Sipariş detay sayfasına yönlendir
        router.push(`/order/${order.id}`);
      } else {
        console.log("🏦 Processing bank transfer payment");

        // Banka havalesi gibi diğer ödeme yöntemleri
        await clearCart();
        resetCheckout();
        onComplete();

        // Sipariş detay sayfasına yönlendir
        router.push(`/order/${order.id}`);
      }
    } catch (error: any) {
      console.error("❌ Order creation failed:", error);
      alert(error?.message || t("checkout.order_creation_failed"));
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Summary Content - Two Column Layout on Desktop */}
      <div className="overflow-y-auto flex-1 min-h-0 px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Address, Payment, Notes */}
          <div className="space-y-3">
            {/* Delivery Address */}
            <div className="bg-card rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Teslimat Adresi</span>
              </div>
              {state.deliveryAddress ? (
                <div className="bg-muted/50 rounded-md p-2.5 text-sm">
                  <p className="font-medium">{state.deliveryAddress.addressTitle}</p>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    {state.deliveryAddress.street}
                    <br />
                    {state.deliveryAddress.postalCode} {state.deliveryAddress.city}
                    <br />
                    {state.deliveryAddress.country}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Adres seçilmedi</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                <span>Ödeme Yöntemi</span>
              </div>
              {state.selectedPaymentMethod ? (
                <div className="bg-muted/50 rounded-md p-2.5 text-sm">
                  <p className="font-medium">{state.selectedPaymentMethod.title}</p>
                  {state.selectedPaymentMethod.subtitle && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {state.selectedPaymentMethod.subtitle}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ödeme yöntemi seçilmedi</p>
              )}
            </div>

            {/* Order Notes */}
            <div className="bg-card rounded-lg border p-3">
              <label className="text-sm font-semibold mb-2 block">Sipariş Notu (İsteğe Bağlı)</label>
              <Textarea
                placeholder="Sipariş ile ilgili özel bir notunuz var mı?"
                value={state.notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>

          {/* Right Column - Order Items & Total */}
          <div className="space-y-3">
            {/* Order Items */}
            <div className="bg-card rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Package className="h-3.5 w-3.5 text-primary" />
                <span>Sipariş Ürünleri</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between text-sm bg-muted/50 rounded-md p-2.5"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm line-clamp-2">{item.product.name}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">Adet: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm whitespace-nowrap">
                      {formatPrice(item.product.price * item.quantity, item.product.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Totals */}
            {summary && (
              <div className="bg-card rounded-lg border p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ara Toplam:</span>
                    <span className="font-medium">
                      {formatPrice(
                        typeof summary.totalAmount === "string"
                          ? parseFloat(summary.totalAmount)
                          : summary.totalAmount,
                        summary.currency ?? "PLN"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Kargo:</span>
                    <span className="font-medium text-green-600">Ücretsiz</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold">Toplam:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(
                        typeof summary.totalAmount === "string"
                          ? parseFloat(summary.totalAmount)
                          : summary.totalAmount,
                        summary.currency ?? "PLN"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terms Agreement - Full Width */}
        <div className="mt-3 flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
          <Checkbox
            id="terms"
            checked={state.agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
            <a href="/legal?type=terms-of-service" target="_blank" className="text-primary hover:underline">
              Kullanım Şartları
            </a>
            {" ve "}
            <a href="/legal?type=privacy-policy" target="_blank" className="text-primary hover:underline">
              Gizlilik Politikası
            </a>
            'nı okudum ve kabul ediyorum.
          </label>
        </div>
      </div>

      {/* Footer - Only Complete Button */}
      <div className="border-t px-4 py-3 flex-shrink-0 bg-background">
        <Button
          onClick={handleCompleteOrder}
          size="lg"
          className="w-full"
          disabled={!canProceedToNext() || isProcessing || orderLoading || paymentLoading}
        >
          {isProcessing || orderLoading || paymentLoading ? "İşleniyor..." : "Siparişi Tamamla"}
        </Button>
      </div>
    </div>
  );
}