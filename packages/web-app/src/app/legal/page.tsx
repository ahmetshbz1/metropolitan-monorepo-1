"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

type LegalType = "privacy-policy" | "cookie-policy" | "terms-of-service";

export default function LegalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { i18n } = useTranslation();

  const language = ((i18n.language || "tr").split("-")[0]) as "tr" | "en" | "pl";

  useEffect(() => {
    const type = searchParams.get("type") as LegalType | null;

    // Eski URL'den yeni URL'e redirect
    if (type === "privacy-policy" || type === "cookie-policy" || type === "terms-of-service") {
      router.replace(`/${type}?lang=${language}`);
    } else {
      // Varsayılan olarak privacy-policy'ye yönlendir
      router.replace(`/privacy-policy?lang=${language}`);
    }
  }, [searchParams, language, router]);

  // Redirect sırasında boş sayfa göster
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );
}
