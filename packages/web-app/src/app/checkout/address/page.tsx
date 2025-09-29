"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore, useCartStore } from "@/stores";
import { MapPin, Plus, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

interface Address {
  id: string;
  title: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  country: string;
  isDefaultDelivery: boolean;
  isDefaultBilling: boolean;
}

export default function CheckoutAddressPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { items } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");
  const [selectedBillingId, setSelectedBillingId] = useState<string>("");
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
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

    // TODO: Fetch addresses from API
    setLoading(false);
  }, [accessToken, items, router]);

  const handleContinue = () => {
    if (!selectedDeliveryId) {
      alert(t("checkout.missing_info"));
      return;
    }

    // Store selections in session/store
    router.push("/checkout/payment");
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

  if (addresses.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Adres Ekleyin</h2>
          <p className="text-muted-foreground mb-6">
            Siparişinizi tamamlamak için önce bir teslimat adresi eklemelisiniz.
          </p>
          <Button asChild>
            <Link href="/addresses/add">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Adres Ekle
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <span className="text-primary font-medium">
            1. {t("checkout.steps.address")}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">
            2. {t("checkout.steps.payment")}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">
            3. {t("checkout.steps.summary")}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-8">
          {t("checkout.delivery_address")}
        </h1>

        {/* Delivery Address */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {t("checkout.delivery_address")}
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/addresses/add">
                <Plus className="mr-2 h-4 w-4" />
                {t("checkout.add_new_address")}
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {addresses.map((address) => (
              <button
                key={address.id}
                onClick={() => {
                  setSelectedDeliveryId(address.id);
                  if (sameAsDelivery) {
                    setSelectedBillingId(address.id);
                  }
                }}
                className={`w-full text-left bg-card rounded-xl border-2 p-4 transition-colors ${
                  selectedDeliveryId === address.id
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{address.title}</h3>
                      {address.isDefaultDelivery && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.fullAddress}
                      <br />
                      {address.postalCode} {address.city}, {address.country}
                    </p>
                  </div>
                  {selectedDeliveryId === address.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Same as Delivery Checkbox */}
        <div className="mb-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sameAsDelivery}
              onChange={(e) => {
                setSameAsDelivery(e.target.checked);
                if (e.target.checked) {
                  setSelectedBillingId(selectedDeliveryId);
                }
              }}
              className="w-5 h-5 rounded border-2 border-gray-300"
            />
            <span className="text-sm">
              {t("checkout.same_billing_address")}
            </span>
          </label>
        </div>

        {/* Billing Address */}
        {!sameAsDelivery && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {t("checkout.billing_address")}
            </h2>
            <div className="space-y-3">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  onClick={() => setSelectedBillingId(address.id)}
                  className={`w-full text-left bg-card rounded-xl border-2 p-4 transition-colors ${
                    selectedBillingId === address.id
                      ? "border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{address.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {address.fullAddress}
                        <br />
                        {address.postalCode} {address.city}, {address.country}
                      </p>
                    </div>
                    {selectedBillingId === address.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full"
          disabled={!selectedDeliveryId}
        >
          {t("checkout.continue_to_payment")}
        </Button>
      </div>
    </div>
  );
}
