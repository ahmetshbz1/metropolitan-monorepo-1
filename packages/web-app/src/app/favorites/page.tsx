"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/api/use-favorites";
import { useProducts } from "@/hooks/api/use-products";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export default function FavoritesPage() {
  const { t } = useTranslation();

  // Favorites artık guest kullanıcılar için de çalışıyor
  const {
    data: favorites,
    isLoading: favoritesLoading,
    isFetching: favoritesFetching
  } = useFavorites();
  const { data: products = [] } = useProducts();

  // Get suggested products (exclude favorites, random 8 products)
  const suggestedProducts = useMemo(() => {
    if (!favorites) return [];
    const favoriteIds = favorites.map((f: any) => f.id);
    const filtered = products.filter((p) => !favoriteIds.includes(p.id));
    return filtered.sort(() => Math.random() - 0.5).slice(0, 8);
  }, [products, favorites]);

  // Loading skeleton - show when loading OR when data hasn't been fetched yet
  const isLoadingFavorites = favoritesLoading || (favoritesFetching && !favorites);

  if (isLoadingFavorites || favorites === undefined) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Title skeleton */}
          <div className="h-9 bg-muted rounded-lg w-48 mb-8 animate-pulse"></div>

          {/* Product grid skeleton */}
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-32 h-56 bg-muted rounded-xl animate-pulse flex flex-col">
                <div className="h-28 bg-muted-foreground/10 rounded-t-xl"></div>
                <div className="flex-1 p-2 space-y-2">
                  <div className="h-3 bg-muted-foreground/10 rounded w-3/4"></div>
                  <div className="h-2 bg-muted-foreground/10 rounded w-full"></div>
                  <div className="h-2 bg-muted-foreground/10 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state - only show when we have loaded data and it's empty
  if (favorites && favorites.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("favorites.empty.title") || "Favori ürününüz yok"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("favorites.empty.subtitle") || "Beğendiğiniz ürünleri favorilere ekleyin"}
          </p>
          <Button asChild>
            <Link href="/products">
              {t("favorites.empty.browse_button") || "Ürünlere Göz At"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">
          {t("favorites.title") || "Favorilerim"}
        </h1>

        {/* Favorites Grid */}
        <div className="flex flex-wrap gap-3 mb-12">
          {favorites && favorites.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Suggested Products */}
        {suggestedProducts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold mb-6">{t("favorites.suggested_products")}</h2>
            <div className="flex flex-wrap gap-3">
              {suggestedProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}