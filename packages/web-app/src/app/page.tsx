"use client";

import { HeroSlider } from "@/components/home/HeroSlider";
import { ProductSection } from "@/components/home/ProductSection";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/context/ProductContext";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const { products, categories, loadingProducts, error } = useProducts();

  const loading = loadingProducts;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-8">
          <div className="h-[300px] md:h-[500px] lg:h-[600px] bg-muted rounded-2xl animate-pulse" />
        </section>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <section key={i} className="py-8">
              <div className="container mx-auto px-4">
                <div className="h-8 bg-muted rounded w-48 mb-6 animate-pulse" />
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3, 4].map((j) => (
                    <div
                      key={j}
                      className="w-80 h-80 bg-muted rounded-lg animate-pulse flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t("error.error_occurred")}
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t("error.try_again")}
          </Button>
        </div>
      </div>
    );
  }

  // Ürünler yok ise boş diziler döndür
  const featuredProducts = products.length > 0 ? products.slice(0, 16) : [];
  const weeklyProducts = products.length > 1 ? products.slice(1, 17) : [];
  const bestSellers = products.length > 2 ? products.slice(2, 18) : [];
  const newArrivals = products.length > 3 ? products.slice(3, 19) : [];

  // Eğer hiç ürün yoksa mesaj göster
  if (!loading && !error && products.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t("error.no_products")}</h2>
          <p className="text-muted-foreground">{t("error.no_products_desc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <HeroSlider />
      </section>

      {/* Featured Products */}
      <ProductSection
        title={t("home.featured_products")}
        products={featuredProducts}
        variant="horizontal"
      />

      {/* Weekly Special */}
      <ProductSection
        title={t("home.weekly_products")}
        products={weeklyProducts}
        variant="horizontal"
      />

      {/* Best Sellers */}
      <ProductSection
        title={t("home.bestsellers")}
        products={bestSellers}
        variant="horizontal"
      />

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <ProductSection
          title={t("home.new_arrivals")}
          products={newArrivals}
          variant="horizontal"
        />
      )}

      {/* Call to Action */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("home.discover_all")}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("home.discover_subtitle")}
          </p>
          <Button size="lg" asChild>
            <Link href="/products">
              {t("home.view_all_products")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
