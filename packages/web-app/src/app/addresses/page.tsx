"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores";
import { MapPin, Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

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

export default function AddressesPage() {
  const { t } = useTranslation();
  const { user, accessToken } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      // TODO: Fetch addresses from API
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Adreslerinizi görmek için giriş yapın</h2>
          <p className="text-muted-foreground mb-6">
            Teslimat adreslerinizi kaydedin ve hızlı sipariş verin.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="h-8 bg-muted rounded w-48 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
            ))}
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
          <h2 className="text-2xl font-bold mb-2">
            {t("addresses.empty.title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("addresses.empty.subtitle")}
          </p>
          <Button asChild>
            <Link href="/addresses/add">
              <Plus className="mr-2 h-5 w-5" />
              {t("addresses.empty.add_button")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t("addresses.title")}</h1>
          <Button asChild>
            <Link href="/addresses/add">
              <Plus className="mr-2 h-5 w-5" />
              {t("addresses.add_new_address")}
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{address.title}</h3>
                  <div className="flex gap-2 mb-2">
                    {address.isDefaultDelivery && (
                      <Badge variant="secondary">
                        {t("addresses.default_delivery")}
                      </Badge>
                    )}
                    {address.isDefaultBilling && (
                      <Badge variant="secondary">
                        {t("addresses.default_billing")}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/addresses/edit/${address.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Delete address
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground">
                {address.fullAddress}
                <br />
                {address.postalCode} {address.city}, {address.country}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
