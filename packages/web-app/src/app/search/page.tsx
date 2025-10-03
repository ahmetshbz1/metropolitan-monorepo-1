"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/api/use-products";
import { Product } from "@metropolitan/shared";
import { Search, X, Sparkles } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function SearchPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { data: allProducts = [], isLoading } = useProducts();

  // Update search query when URL param changes
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  // Client-side search with smart scoring
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();

    return allProducts
      .map((product) => {
        const name = product.name?.toLowerCase() || "";
        const description = product.description?.toLowerCase() || "";
        const brand = product.brand?.toLowerCase() || "";
        const category = product.category?.toLowerCase() || "";

        // Scoring system: name match = 100, brand = 50, category = 30, description = 10
        let score = 0;

        if (name.includes(query)) {
          score += 100;
          // Bonus if name starts with query
          if (name.startsWith(query)) score += 50;
        }

        if (brand.includes(query)) score += 50;
        if (category.includes(query)) score += 30;
        if (description.includes(query)) score += 10;

        return { product, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);
  }, [allProducts, searchQuery]);

  // Recommended products - smart recommendations based on search context
  const recommendedProducts = useMemo(() => {
    if (searchQuery.length < 2 || searchResults.length === 0) {
      // No search or no results - show random products
      return allProducts
        .filter(p => p.stock > 0)
        .sort(() => Math.random() - 0.5)
        .slice(0, 24); // 2 rows x 12 products
    }

    // Has search results - show related products (same category or brand)
    const searchedCategories = new Set(searchResults.map(p => p.category).filter(Boolean));
    const searchedBrands = new Set(searchResults.map(p => p.brand).filter(Boolean));

    return allProducts
      .filter(p => {
        // Exclude already shown products
        if (searchResults.some(sr => sr.id === p.id)) return false;
        // Must be in stock
        if (p.stock === 0) return false;
        // Same category or brand
        return searchedCategories.has(p.category) || searchedBrands.has(p.brand);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 24); // 2 rows x 12 products
  }, [allProducts, searchQuery, searchResults]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded-lg w-full max-w-md mb-6"></div>
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {searchQuery.length < 2 ? (
          <>
            {/* Recommended Products Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{t("search.recommended")}</h1>
                  <p className="text-sm text-muted-foreground">
                    {t("search.recommended_desc")}
                  </p>
                </div>
              </div>

              {recommendedProducts.length > 0 ? (
                <div className="space-y-3">
                  {/* First Row */}
                  <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex gap-3 min-w-max">
                      {recommendedProducts.slice(0, 12).map((product: Product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                  {/* Second Row */}
                  {recommendedProducts.length > 12 && (
                    <div className="overflow-x-auto pb-2 scrollbar-hide">
                      <div className="flex gap-3 min-w-max">
                        {recommendedProducts.slice(12, 24).map((product: Product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{t("error.no_products")}</h2>
                  <p className="text-muted-foreground text-center max-w-md">
                    {t("search.no_products")}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Results Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">
                {t("search.results_for", { query: searchQuery })}
              </h1>
              <p className="text-muted-foreground">
                {t("search.products_found", { count: searchResults.length })}
              </p>
            </div>

            {/* Products Grid */}
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t("search.no_results")}</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  {t("search.no_results_desc", { query: searchQuery })}
                </p>
                <Button onClick={() => router.push("/products")}>
                  {t("search.browse_all")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {searchResults.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Recommended Products Section - Show after search results */}
            {searchResults.length > 0 && recommendedProducts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">{t("search.related")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("search.related_desc")}
                  </p>
                </div>
                <div className="space-y-3">
                  {/* First Row */}
                  <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex gap-3 min-w-max">
                      {recommendedProducts.slice(0, 12).map((product: Product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                  {/* Second Row */}
                  {recommendedProducts.length > 12 && (
                    <div className="overflow-x-auto pb-2 scrollbar-hide">
                      <div className="flex gap-3 min-w-max">
                        {recommendedProducts.slice(12, 24).map((product: Product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}