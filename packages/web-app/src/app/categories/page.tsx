"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { useProducts } from "@/context/ProductContext";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { products, loadingProducts } = useProducts();

  const categorizedProducts = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    products.forEach((product) => {
      const category = product.category || "Diğer";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });

    return grouped;
  }, [products]);

  const categories = Object.keys(categorizedProducts).sort();

  if (loadingProducts && products.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-muted rounded w-48 mb-8 animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-12">
              <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div
                    key={j}
                    className="h-64 bg-muted rounded-xl animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Henüz kategori bulunmuyor</h2>
          <p className="text-muted-foreground">
            Ürünler eklendiğinde burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t("navbar.categories")}</h1>

        {categories.map((category) => (
          <div key={category} id={category.toLowerCase()} className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{category}</h2>
              <span className="text-sm text-muted-foreground">
                {categorizedProducts[category].length} ürün
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {categorizedProducts[category].map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
