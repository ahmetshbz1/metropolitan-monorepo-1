"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/api/use-favorites";
import { useAuth } from "@/context/AuthContext";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading, accessToken } = useAuth();

  // Skip loading state and show empty immediately if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Favori ürünlerinizi görmek için giriş yapın</h2>
          <p className="text-muted-foreground mb-6">
            Beğendiğiniz ürünleri favorilere ekleyin ve kolayca erişin.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites();

  // If favorites are loaded and we have data, show it (ignore auth loading state issue)
  const hasLoadedFavorites = !favoritesLoading && favorites !== undefined;
  const shouldShowLoading = (authLoading && !hasLoadedFavorites) || favoritesLoading;

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-muted rounded w-48 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("favorites.empty.title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("favorites.empty.subtitle")}
          </p>
          <Button asChild>
            <Link href="/products">{t("favorites.empty.browse_button")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t("favorites.title")}</h1>
        <div className="flex flex-wrap gap-3">
          {favorites.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
