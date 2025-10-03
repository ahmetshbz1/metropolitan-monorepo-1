"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAddress, useUpdateAddress } from "@/hooks/api/use-addresses";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address;
  onSuccess?: () => void;
}

export function AddressDialog({
  open,
  onOpenChange,
  address,
  onSuccess,
}: AddressDialogProps) {
  const { t } = useTranslation();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const [formData, setFormData] = useState({
    addressTitle: "",
    street: "",
    city: "",
    postalCode: "",
    country: "Poland",
    isDefaultDelivery: false,
    isDefaultBilling: false,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        addressTitle: address.addressTitle || "",
        street: address.street || "",
        city: address.city || "",
        postalCode: address.postalCode || "",
        country: address.country || "Poland",
        isDefaultDelivery: address.isDefaultDelivery || false,
        isDefaultBilling: address.isDefaultBilling || false,
      });
    } else {
      setFormData({
        addressTitle: "",
        street: "",
        city: "",
        postalCode: "",
        country: "Poland",
        isDefaultDelivery: false,
        isDefaultBilling: false,
      });
    }
  }, [address, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (address) {
        await updateAddress.mutateAsync({
          id: address.id,
          data: formData,
        });
      } else {
        await createAddress.mutateAsync(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Address save error:", error);
    }
  };

  const isLoading = createAddress.isPending || updateAddress.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {address
              ? t("addresses.edit_address")
              : t("addresses.add_new_address")}
          </DialogTitle>
          <DialogDescription>
            {address
              ? "Adres bilgilerinizi güncelleyin"
              : "Yeni teslimat adresi ekleyin"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="addressTitle">Adres Başlığı</Label>
              <Input
                id="addressTitle"
                placeholder="Ev, İş, vb."
                value={formData.addressTitle}
                onChange={(e) =>
                  setFormData({ ...formData, addressTitle: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="street">Adres</Label>
              <Input
                id="street"
                placeholder="Sokak, cadde, mahalle..."
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  placeholder="Warszawa"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="postalCode">Posta Kodu</Label>
                <Input
                  id="postalCode"
                  placeholder="00-001"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Ülke</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                required
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefaultDelivery"
                  checked={formData.isDefaultDelivery}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isDefaultDelivery: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="isDefaultDelivery" className="cursor-pointer">
                  Varsayılan teslimat adresi
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefaultBilling"
                  checked={formData.isDefaultBilling}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isDefaultBilling: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="isDefaultBilling" className="cursor-pointer">
                  Varsayılan fatura adresi
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
