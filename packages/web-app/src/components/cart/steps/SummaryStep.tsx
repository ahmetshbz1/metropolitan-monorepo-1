"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCheckout } from "@/context/CheckoutContext";
import { useCartStore } from "@/stores/cart-store";
import { MapPin, CreditCard, Package } from "lucide-react";
import { useState } from "react";

interface SummaryStepProps {
  onComplete: () => void;
}

export function SummaryStep({ onComplete }: SummaryStepProps) {
  const { state, setAgreedToTerms, setNotes, canProceedToNext } = useCheckout();
  const items = useCartStore((state) => state.items);
  const summary = useCartStore((state) => state.summary);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleCompleteOrder = async () => {
    if (!canProceedToNext()) return;

    setIsProcessing(true);
    try {
      // TODO: Sipariş oluşturma API çağrısı
      // const order = await createOrder({ ... });

      // Stripe ödeme için redirect
      // if (state.selectedPaymentMethod?.type === "card") {
      //   window.location.href = checkoutUrl;
      // }

      // Şimdilik sadece drawer'ı kapat
      setTimeout(() => {
        onComplete();
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error("Order creation failed:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Summary Content */}
      <div className="overflow-y-auto flex-1 min-h-0 px-6 py-4 space-y-6">
        {/* Delivery Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Teslimat Adresi</span>
          </div>
          {state.deliveryAddress ? (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">{state.deliveryAddress.addressTitle}</p>
              <p className="text-muted-foreground mt-1">
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>Ödeme Yöntemi</span>
          </div>
          {state.selectedPaymentMethod ? (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">{state.selectedPaymentMethod.name}</p>
              {state.selectedPaymentMethod.description && (
                <p className="text-muted-foreground mt-1">
                  {state.selectedPaymentMethod.description}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ödeme yöntemi seçilmedi</p>
          )}
        </div>

        {/* Order Items */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Package className="h-4 w-4 text-primary" />
            <span>Sipariş Ürünleri</span>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-muted-foreground text-xs">Adet: {item.quantity}</p>
                </div>
                <p className="font-semibold">
                  {formatPrice(item.product.price * item.quantity, item.product.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Sipariş Notu (İsteğe Bağlı)</label>
          <Textarea
            placeholder="Sipariş ile ilgili özel bir notunuz var mı?"
            value={state.notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            id="terms"
            checked={state.agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm cursor-pointer">
            <a href="/legal/terms" target="_blank" className="text-primary hover:underline">
              Kullanım Şartları
            </a>
            {" ve "}
            <a href="/legal/privacy" target="_blank" className="text-primary hover:underline">
              Gizlilik Politikası
            </a>
            'nı okudum ve kabul ediyorum.
          </label>
        </div>
      </div>

      {/* Footer with Total */}
      <div className="border-t px-6 py-4 space-y-4 flex-shrink-0 bg-background">
        {/* Total */}
        {summary && (
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
              <span className="font-medium">Ücretsiz</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">Toplam:</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(
                  typeof summary.totalAmount === "string"
                    ? parseFloat(summary.totalAmount)
                    : summary.totalAmount,
                  summary.currency ?? "PLN"
                )}
              </span>
            </div>
          </div>
        )}

        {/* Complete Order Button */}
        <Button
          onClick={handleCompleteOrder}
          size="lg"
          className="w-full"
          disabled={!canProceedToNext() || isProcessing}
        >
          {isProcessing ? "İşleniyor..." : "Siparişi Tamamla"}
        </Button>
      </div>
    </div>
  );
}