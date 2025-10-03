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
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">{t("addresses.title")}</h1>
          <Button onClick={() => {
            setEditingAddress(null);
            setDialogOpen(true);
          }} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            {t("addresses.add_new_address")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="group relative bg-card rounded-lg border border-border p-4 hover:shadow-md hover:border-primary/30 transition-all"
            >
              {/* Action Buttons - Show on Hover */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    setEditingAddress(address);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => deleteAddress.mutate(address.id)}
                  disabled={deleteAddress.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex items-start gap-2.5 mb-3">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 pr-14">
                  <h3 className="font-semibold text-sm mb-1 truncate">{address.addressTitle}</h3>
                  {(address.isDefaultDelivery || address.isDefaultBilling) && (
                    <div className="flex gap-1.5 mb-2">
                      {address.isDefaultDelivery && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {t("addresses.default_delivery")}
                        </Badge>
                      )}
                      {address.isDefaultBilling && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {t("addresses.default_billing")}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {address.street}
                <br />
                {address.postalCode} {address.city}
                <br />
                {address.country}
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
