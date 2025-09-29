"use client";

import { useState } from "react";
import { Heart, ShoppingCart, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Product } from "@metropolitan/shared";
import { useTranslation } from "react-i18next";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "horizontal";
}

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = async () => {
    if (isOutOfStock || isLoading) return;
    
    setIsLoading(true);
    try {
      // API call için - gerçek implementation eklenecek
      console.log("Adding to cart:", product.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const formatPrice = (price: number, currency = "TRY") => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (variant === "horizontal") {
    return (
      <Link href={`/product/${product.id}`} className="block">
        <div className="w-32 h-56 flex-shrink-0 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border flex flex-col cursor-pointer">
          <div className="relative">
            {/* Product Image */}
            <div className="relative h-28 bg-muted">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="w-12 h-12 bg-muted-foreground/20 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-muted-foreground/30 rounded-lg"></div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button - Top Right */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart();
                }}
                disabled={isOutOfStock || isLoading}
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                  isOutOfStock
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    : "bg-primary hover:bg-primary/90 text-white hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-sm font-bold">+</span>
                )}
              </button>

              {/* Out of Stock Overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="bg-white/95 text-gray-900 px-2 py-1 rounded text-xs font-medium">
                    Stokta Yok
                  </div>
                </div>
              )}
            </div>

            <div className="p-2 flex-1 flex flex-col">
              {/* Price */}
              <div className="mb-1">
                <span className="font-bold text-base text-primary">
                  {formatPrice(product.price, product.currency)}
                </span>
              </div>

              {/* Product Name */}
              <h3 className="font-medium text-xs text-gray-700 dark:text-gray-300 line-clamp-2 hover:text-primary transition-colors mb-1 leading-tight flex-1">
                {product.name}
              </h3>

              {/* Bottom section */}
              <div className="mt-auto">
                {/* Size/Unit Info */}
                {product.size && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {product.size}
                  </div>
                )}

                {/* Stock Status */}
                {isLowStock && !isOutOfStock && (
                  <div className="flex items-center">
                    <div className="w-1 h-1 bg-amber-400 rounded-full mr-1"></div>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Son {product.stock}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link href={`/product/${product.id}`} className="block">
      <div className="w-32 h-56 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border flex flex-col cursor-pointer">
        {/* Product Image */}
        <div className="relative h-28 bg-muted">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 bg-muted-foreground/20 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-muted-foreground/30 rounded-lg"></div>
              </div>
            </div>
          )}

          {/* Add to Cart Button - Top Right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={isOutOfStock || isLoading}
            className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
              isOutOfStock
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                : "bg-primary hover:bg-primary/90 text-white hover:scale-105"
            }`}
          >
            {isLoading ? (
              <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-sm font-bold">+</span>
            )}
          </button>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-white/95 text-gray-900 px-2 py-1 rounded text-xs font-medium">
                {t("product.out_of_stock")}
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-2 flex-1 flex flex-col">
          {/* Price */}
          <div className="mb-1">
            <span className="font-bold text-base text-primary">
              {formatPrice(product.price, product.currency)}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-medium text-xs text-gray-700 dark:text-gray-300 line-clamp-2 hover:text-primary transition-colors mb-1 leading-tight flex-1">
            {product.name}
          </h3>

          {/* Bottom section */}
          <div className="mt-auto">
            {/* Size/Unit Info */}
            {product.size && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {product.size}
              </div>
            )}

            {/* Stock Status */}
            {isLowStock && !isOutOfStock && (
              <div className="flex items-center">
                <div className="w-1 h-1 bg-amber-400 rounded-full mr-1"></div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Son {product.stock}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
