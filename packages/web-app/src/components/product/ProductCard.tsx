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
      <div className="w-72 flex-shrink-0 bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border">
        <div className="relative">
          {/* Product Image */}
          <div className="relative h-44 bg-muted">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="w-16 h-16 bg-muted-foreground/20 rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 bg-muted-foreground/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                    {t("product.no_image")}
                  </div>
                </div>
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {product.badges?.organic && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                  Organik
                </div>
              )}
              {product.badges?.halal && (
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded-full font-medium">
                  Helal
                </div>
              )}
            </div>

            {/* Favorite Button */}
            <button
              className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center transition-colors ${
                isFavorite 
                  ? "text-red-500" 
                  : "text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
              }`}
              onClick={toggleFavorite}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </button>

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="bg-white/95 text-gray-900 px-3 py-2 rounded-lg font-medium text-sm">
                  Stokta Yok
                </div>
              </div>
            )}
          </div>

          <div className="p-4">
            {/* Product Name */}
            <Link href={`/product/${product.id}`}>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 hover:text-primary transition-colors mb-3 leading-tight">
                {product.name}
              </h3>
            </Link>

            {/* Price and Add to Cart Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-primary">
                  {formatPrice(product.price, product.currency)}
                </span>
                {product.size && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {product.size}
                  </span>
                )}
              </div>

              {/* Simple Add Button - Mobile Style */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isOutOfStock 
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400" 
                    : "bg-primary hover:bg-primary/90 text-white hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Stock Status */}
            {isLowStock && !isOutOfStock && (
              <div className="flex items-center justify-center mt-3 py-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {t("product.low_stock", { count: product.stock })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className="bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border">
      <div className="relative">
        {/* Product Image */}
        <div className="relative aspect-square bg-muted">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="w-16 h-16 bg-muted-foreground/20 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 bg-muted-foreground/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                  {t("product.no_image")}
                </div>
              </div>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.badges?.organic && (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                {t("product.organic")}
              </div>
            )}
            {product.badges?.halal && (
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded-full font-medium">
                {t("product.halal")}
              </div>
            )}
          </div>

          {/* Favorite Button */}
          <button
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center transition-colors ${
              isFavorite 
                ? "text-red-500" 
                : "text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            }`}
            onClick={toggleFavorite}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-white/95 text-gray-900 px-3 py-2 rounded-lg font-medium text-sm">
                {t("product.out_of_stock")}
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Product Name */}
          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 hover:text-primary transition-colors mb-3 leading-tight">
              {product.name}
            </h3>
          </Link>

          {/* Price and Add to Cart Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.size && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {product.size}
                </span>
              )}
            </div>

            {/* Simple Add Button - Mobile Style */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isOutOfStock 
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400" 
                  : "bg-primary hover:bg-primary/90 text-white hover:scale-105"
              }`}
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Stock Status */}
          {isLowStock && !isOutOfStock && (
            <div className="flex items-center justify-center mt-3 py-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Son {product.stock} adet
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
