"use client";

import { ShoppingCart, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MinimumQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minQuantity: number;
  productName: string;
  loading?: boolean;
  onConfirm: () => void;
}

export function MinimumQuantityDialog({
  open,
  onOpenChange,
  minQuantity,
  productName,
  loading = false,
  onConfirm,
}: MinimumQuantityDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={!loading}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {t("product_card.minimum_quantity_dialog.title")}
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p className="font-medium text-foreground">{productName}</p>
            <p>{t("errors.MIN_QUANTITY_NOT_MET", { minQuantity })}</p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 sm:flex-initial"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 sm:flex-initial"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              t("product_detail.purchase.add_min_quantity", { count: minQuantity })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
