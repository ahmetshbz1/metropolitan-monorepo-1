"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useAddresses, useDeleteAddress } from "@/hooks/api/use-addresses";
import { MapPin, Plus, Trash2, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AddressDialog } from "@/components/address/AddressDialog";
import { useState } from "react";

export default function AddressesPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // If addresses are loaded and we have data, show it (ignore auth loading state issue)
  const hasLoadedAddresses = !addressesLoading && addresses !== undefined;
  const shouldShowLoading = (authLoading && !hasLoadedAddresses) || addressesLoading;

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("addresses.login_required")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("addresses.login_message")}
          </p>
          <Button onClick={() => window.location.href = '/auth/phone-login'}>
            {t("addresses.login_button")}
          </Button>
        </div>
      </div>
    );
  }

  if (shouldShowLoading) {
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
      <>
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
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              {t("addresses.empty.add_button")}
            </Button>
          </div>
        </div>

        <AddressDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          address={editingAddress}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingAddress(null);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t("addresses.title")}</h1>
          <Button onClick={() => {
            setEditingAddress(null);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-5 w-5" />
            {t("addresses.add_new_address")}
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
                  <h3 className="font-semibold text-lg mb-1">{address.addressTitle}</h3>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAddress(address);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAddress.mutate(address.id)}
                    disabled={deleteAddress.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground">
                {address.street}
                <br />
                {address.postalCode} {address.city}, {address.country}
              </p>
            </div>
          ))}
        </div>

        <AddressDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          address={editingAddress}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingAddress(null);
          }}
        />
      </div>
    </div>
  );
}
