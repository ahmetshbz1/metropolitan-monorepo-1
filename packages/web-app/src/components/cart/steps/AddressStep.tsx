"use client";

import { Button } from "@/components/ui/button";
import { useCheckout } from "@/context/CheckoutContext";
import { useAddresses } from "@/hooks/api/use-addresses";
import { AddressDialog } from "@/components/address/AddressDialog";
import { MapPin, Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function AddressStep() {
  const { state, setDeliveryAddress, nextStep, canProceedToNext } = useCheckout();
  const { data: addresses = [], isLoading } = useAddresses();
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // Auto-select default delivery address
  useEffect(() => {
    if (addresses.length > 0 && !state.deliveryAddress) {
      const defaultAddress = addresses.find((addr) => addr.isDefaultDelivery) || addresses[0];
      setDeliveryAddress(defaultAddress);
    }
  }, [addresses, state.deliveryAddress, setDeliveryAddress]);

  const handleAddressDialogSuccess = () => {
    setIsAddressDialogOpen(false);
    // Yeni adres eklendiğinde React Query otomatik refresh yapacak
    // Ve useEffect yeni adresi otomatik seçecek (varsayılan veya ilk adres)
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Adresler yükleniyor...</p>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Kayıtlı Adresiniz Yok</h3>
        <p className="text-muted-foreground mb-6">
          Sipariş vermek için önce bir teslimat adresi eklemelisiniz
        </p>
        <Button onClick={() => setIsAddressDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adres Ekle
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* Address List */}
        <div className="overflow-y-auto flex-1 min-h-0 px-6 py-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Teslimat Adresi Seçin</h3>
            <Button variant="outline" size="sm" onClick={() => setIsAddressDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Adres
            </Button>
          </div>

        {addresses.map((address) => (
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
            onClick={() => setDeliveryAddress(address)}
          >
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{address.addressTitle}</h4>
                  {address.isDefaultDelivery && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Varsayılan
                    </span>
                  )}
                </div>
                <p className="text-sm">
                  {address.street}, {address.postalCode} {address.city}
                </p>
                <p className="text-sm text-muted-foreground">{address.country}</p>
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

      {/* Address Dialog */}
      <AddressDialog
        open={isAddressDialogOpen}
        onOpenChange={setIsAddressDialogOpen}
        onSuccess={handleAddressDialogSuccess}
      />
    </>
  );
}