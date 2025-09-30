"use client";

import { Button } from "@/components/ui/button";
import { useCheckout } from "@/context/CheckoutContext";
import { MapPin, Plus } from "lucide-react";

export function AddressStep() {
  const { state, nextStep, canProceedToNext } = useCheckout();

  // Placeholder - Adres listesi API'den gelecek
  const mockAddresses = [
    {
      id: "1",
      title: "Ev",
      fullName: "Ahmet Yılmaz",
      phoneNumber: "+48 123 456 789",
      addressLine1: "Ul. Marszałkowska 123",
      city: "Warszawa",
      province: "Mazowieckie",
      postalCode: "00-001",
      country: "Polonya",
    },
    {
      id: "2",
      title: "İş",
      fullName: "Ahmet Yılmaz",
      phoneNumber: "+48 123 456 789",
      addressLine1: "Al. Jerozolimskie 456",
      city: "Warszawa",
      province: "Mazowieckie",
      postalCode: "00-002",
      country: "Polonya",
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Address List */}
      <div className="overflow-y-auto flex-1 min-h-0 px-6 py-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Teslimat Adresi Seçin</h3>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Adres
          </Button>
        </div>

        {mockAddresses.map((address) => (
          <div
            key={address.id}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-colors
              ${
                state.deliveryAddress?.id === address.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }
            `}
            onClick={() => {
              // setDeliveryAddress(address) - bu CheckoutContext'ten gelecek
            }}
          >
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{address.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{address.fullName}</p>
                <p className="text-sm">
                  {address.addressLine1}, {address.postalCode} {address.city}
                </p>
                <p className="text-sm text-muted-foreground">{address.phoneNumber}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 flex-shrink-0 bg-background">
        <Button onClick={nextStep} size="lg" className="w-full" disabled={!canProceedToNext()}>
          Devam Et
        </Button>
      </div>
    </div>
  );
}