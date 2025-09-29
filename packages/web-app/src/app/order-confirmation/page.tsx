"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function OrderConfirmationPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">
          Siparişiniz Alındı!
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Siparişiniz başarıyla oluşturuldu. Sipariş detaylarınızı e-posta adresinize gönderdik.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/orders">Siparişlerime Git</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/products">Alışverişe Devam Et</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
