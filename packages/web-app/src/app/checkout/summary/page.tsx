"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore, useCartStore } from "@/stores";
import { Package, MapPin, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function CheckoutSummaryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.push("/auth/phone-login");
      return;
    }

    if (items.length === 0) {
      router.push("/cart");
      return;
    }
  }, [accessToken, items, router]);

  const formatPrice = (price: number, currency = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
    }).format(price);
  };

  const handlePlaceOrder = async () => {
    if (!agreeTerms) {
      alert(t("checkout.agree_terms"));
      return;
    }

    try {
      setLoading(true);
      // TODO: API call to create order
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      clearCart();
      router.push("/order-confirmation");
    } catch (error) {
      console.error("Failed to place order:", error);
      alert(t("checkout.order_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <span className="text-muted-foreground">
            1. {t("checkout.steps.address")}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">
            2. {t("checkout.steps.payment")}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-primary font-medium">
            3. {t("checkout.steps.summary")}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-8">
          {t("checkout.order_summary")}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Sipariş İçeriği ({items.length} {t("checkout.items")})
                </h2>
              </div>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatPrice(item.price, item.currency)}
                      </p>
                    </div>
                    <div className="font-semibold">
                      {formatPrice(item.price * item.quantity, item.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address (Mock) */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  {t("checkout.delivery_address")}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Seçilen adres burada gösterilecek
              </p>
            </div>

            {/* Payment Method (Mock) */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  {t("checkout.payment_method")}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Seçilen ödeme yöntemi burada gösterilecek
              </p>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">
                {t("checkout.order_summary")}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("checkout.subtotal")}
                  </span>
                  <span className="font-medium">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("checkout.shipping")}
                  </span>
                  <span className="font-medium text-green-600">
                    {t("checkout.free")}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      {t("checkout.total")}
                    </span>
                    <span className="font-bold text-xl text-primary">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-2 border-gray-300"
                />
                <span className="text-sm text-muted-foreground">
                  {t("checkout.agree_terms")}
                </span>
              </label>

              <Button
                onClick={handlePlaceOrder}
                size="lg"
                className="w-full"
                disabled={!agreeTerms || loading}
              >
                {loading ? "İşleniyor..." : t("checkout.complete_order")}
              </Button>

              <div className="mt-4 text-center">
                <button
                  onClick={() => router.back()}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  ← Geri dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
