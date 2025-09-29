"use client";

import { Badge } from "@/components/ui/badge";
import { useProductSearch } from "@/hooks/api";
import { Package, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading } =
    useProductSearch(debouncedQuery);

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
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder={mounted ? t("navbar.search_placeholder") : "Ara..."}
          className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </form>

      {/* Search Results Dropdown */}
      {showResults && (searchResults.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              Aranıyor...
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
                          Stokta
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100">
                          Tükendi
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
                    "{searchQuery}" için tüm sonuçları gör →
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
