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
              ? t("address_dialog.edit_title")
              : t("address_dialog.add_title")}
          </DialogTitle>
          <DialogDescription>
            {address
              ? t("address_dialog.update_description")
              : t("address_dialog.add_description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="addressTitle">
                {t("address_dialog.labels.address_title")}
              </Label>
              <Input
                id="addressTitle"
                placeholder={t("address_dialog.placeholders.address_title")}
                value={formData.addressTitle}
                onChange={(e) =>
                  setFormData({ ...formData, addressTitle: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="street">
                {t("address_dialog.labels.street")}
              </Label>
              <Input
                id="street"
                placeholder={t("address_dialog.placeholders.street")}
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">
                  {t("address_dialog.labels.city")}
                </Label>
                <Input
                  id="city"
                  placeholder={t("address_dialog.placeholders.city")}
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="postalCode">
                  {t("address_dialog.labels.postal_code")}
                </Label>
                <Input
                  id="postalCode"
                  placeholder={t("address_dialog.placeholders.postal_code")}
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">
                {t("address_dialog.labels.country")}
              </Label>
              <Input
                id="country"
                placeholder={t("address_dialog.placeholders.country")}
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
                  {t("address_dialog.labels.default_delivery")}
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
                  {t("address_dialog.labels.default_billing")}
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
              {t("address_dialog.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t("address_dialog.messages.loading")
                : t("address_dialog.buttons.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
