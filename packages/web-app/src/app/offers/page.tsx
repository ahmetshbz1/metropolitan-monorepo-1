"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { useProducts } from "@/context/ProductContext";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export default function OffersPage() {
  const { t } = useTranslation();
  const { products, loadingProducts } = useProducts();

  // Filter products with discounts (originalPrice > price)
  const offerProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.originalPrice && product.originalPrice > product.price
    );
  }, [products]);

  if (loadingProducts && products.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-muted rounded w-48 mb-8 animate-pulse"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div
                key={i}
                className="h-64 bg-muted rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (offerProducts.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-12 w-12 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Şu anda kampanya bulunmuyor</h2>
          <p className="text-muted-foreground">
            Yeni kampanyalar eklendiğinde burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Fırsatlar</h1>
            <p className="text-muted-foreground">
              {offerProducts.length} indirimli ürün bulundu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {offerProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
