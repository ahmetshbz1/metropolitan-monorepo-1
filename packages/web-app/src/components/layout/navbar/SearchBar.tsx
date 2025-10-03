"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/api/use-products";
import { Package, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  onProductClick?: () => void;
}

export function SearchBar({ onProductClick }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  // Get all products (already cached from homepage)
  const { data: allProducts = [], isLoading: productsLoading } = useProducts();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search query (reduced to 150ms for faster response)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client-side search with smart scoring
  const searchResults = useMemo(() => {
    if (debouncedQuery.length < 2) return [];

    const query = debouncedQuery.toLowerCase();

    return allProducts
      .map((product) => {
        const name = product.name?.toLowerCase() || "";
        const description = product.description?.toLowerCase() || "";
        const brand = product.brand?.toLowerCase() || "";

        // Scoring system: name match = 100, brand = 50, description = 10
        let score = 0;

        if (name.includes(query)) {
          score += 100;
          // Bonus if name starts with query
          if (name.startsWith(query)) score += 50;
        }

        if (brand.includes(query)) score += 50;
        if (description.includes(query)) score += 10;

        return { product, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ product }) => product);
  }, [allProducts, debouncedQuery]);

  const isLoading = productsLoading && allProducts.length === 0;

  // Auto-show results when data arrives
  useEffect(() => {
    if (debouncedQuery.length > 2 && (searchResults.length > 0 || isLoading)) {
      setShowResults(true);
    } else if (debouncedQuery.length <= 2) {
      setShowResults(false);
    }
  }, [searchResults, isLoading, debouncedQuery]);

  const handleProductClick = (productId: string) => {
    setSearchQuery("");
    setShowResults(false);
    router.push(`/product/${productId}`);
    onProductClick?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onProductClick?.();
    }
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
      <form onSubmit={handleSubmit}>
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (debouncedQuery.length > 2 && (searchResults.length > 0 || isLoading)) {
              setShowResults(true);
            }
          }}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder={mounted ? t("navbar.search_placeholder") : "Ara..."}
          className="pl-10 pr-4"
        />
      </form>

      {/* Search Results Dropdown */}
      {showResults && (searchResults.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              {t("navbar.searching")}
            </div>
          ) : (
            <>
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {product.brand}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-primary">
                        {product.price.toFixed(2)} {product.currency}
                      </span>
                      {product.stock > 0 ? (
                        <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                          {t("navbar.in_stock")}
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100">
                          {t("navbar.out_of_stock")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {searchQuery.trim().length >= 2 && (
                <div className="p-3 border-t border-border bg-muted/30">
                  <button
                    onClick={handleSubmit}
                    className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {t("navbar.view_all_results", { query: searchQuery })} →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
