"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Sayfa Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">
          Aradığınız sayfa bulunamadı veya taşınmış olabilir.
        </p>
        <Button asChild>
          <Link href="/">Ana Sayfaya Dön</Link>
        </Button>
      </div>
    </div>
  );
}
