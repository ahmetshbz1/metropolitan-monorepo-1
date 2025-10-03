"use client";

import { Heart, ShoppingCart, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Product } from "@metropolitan/shared";
import { useTranslation } from "react-i18next";
import { useAddToCart } from "@/hooks/api/use-cart";
import { useAddFavorite, useRemoveFavorite, useFavoriteIds } from "@/hooks/api/use-favorites";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MinimumQuantityDialog } from "./MinimumQuantityDialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "horizontal";
}

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const addToCartMutation = useAddToCart();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  const user = useAuthStore((state) => state.user);

  // Minimum quantity dialog state
  const [showMinQuantityDialog, setShowMinQuantityDialog] = useState(false);
  const [minQuantityError, setMinQuantityError] = useState<number | null>(null);
  const [isAddingMinQuantity, setIsAddingMinQuantity] = useState(false);

  // Favorite durumunu store'dan al
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const isFavorite = favoriteIds.includes(product.id);

  // Favorite ID'lerini fetch et
  useFavoriteIds();

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // User type'a göre price hesapla
  const userType = user?.userType || "individual";
  const displayPrice = userType === "corporate" && product.corporatePrice !== undefined
    ? product.corporatePrice
    : userType === "individual" && product.individualPrice !== undefined
    ? product.individualPrice
    : product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
    } catch (error: any) {
      // Minimum quantity hatası gelirse dialog göster
      const errorPayload = error.response?.data;
      const key = errorPayload?.key;

      if (key === "MIN_QUANTITY_NOT_MET" && errorPayload.params?.minQuantity) {
        const minQty = errorPayload.params.minQuantity;
        setMinQuantityError(minQty);
        setShowMinQuantityDialog(true);
      }
      // Toast zaten use-cart içinde gösteriliyor
    }
  };

  const handleAddMinQuantity = async () => {
    if (!minQuantityError) return;

    setIsAddingMinQuantity(true);
    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity: minQuantityError,
      });
      setShowMinQuantityDialog(false);
      setMinQuantityError(null);
    } catch (addError) {
      // Error toast zaten gösterildi
    } finally {
      setIsAddingMinQuantity(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isFavorite) {
        await removeFavoriteMutation.mutateAsync(product.id);
      } else {
        await addFavoriteMutation.mutateAsync(product.id);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const formatPrice = (price: number, currency = "TRY") => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (variant === "horizontal") {
    return (
      <>
        <Link href={`/product/${product.id}`} className="block">
          <div className="w-32 h-56 flex-shrink-0 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border flex flex-col cursor-pointer">
            <div className="relative">
              {/* Product Image */}
              <div className="relative h-28 bg-card">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-card">
                    <div className="w-12 h-12 bg-muted-foreground/20 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 bg-muted-foreground/30 rounded-lg"></div>
                    </div>
                  </div>
                )}

                {/* Favorite Button - Top Left */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleFavorite}
                      disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                      className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center transition-all z-10 hover:scale-110"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          isFavorite
                            ? "fill-red-500 text-red-500"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFavorite ? t("product_card.tooltip.remove_from_favorites") : t("product_card.tooltip.add_to_favorites")}
                  </TooltipContent>
                </Tooltip>

                {/* Add to Cart Button - Top Right */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || addToCartMutation.isPending}
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                        isOutOfStock
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                          : "bg-primary hover:bg-primary/90 text-white hover:scale-105"
                      }`}
                    >
                      {addToCartMutation.isPending ? (
                        <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="text-sm font-bold">+</span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("product_card.tooltip.add_to_cart")}
                  </TooltipContent>
                </Tooltip>

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="bg-white/95 text-gray-900 px-2 py-1 rounded text-xs font-medium">
                      {t("product.out_of_stock")}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2 flex-1 flex flex-col">
                {/* Price */}
                <div className="mb-1">
                  <span className="font-bold text-base text-primary">
                    {formatPrice(displayPrice, product.currency)}
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

        {/* Minimum Quantity Dialog */}
        <MinimumQuantityDialog
          open={showMinQuantityDialog}
          onOpenChange={setShowMinQuantityDialog}
          minQuantity={minQuantityError || 1}
          productName={product.name}
          loading={isAddingMinQuantity}
          onConfirm={handleAddMinQuantity}
        />
      </>
    );
  }

  // Grid variant (default)
  return (
    <>
      <Link href={`/product/${product.id}`} className="block">
        <div className="w-32 h-56 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border flex flex-col cursor-pointer">
          {/* Product Image */}
          <div className="relative h-28 bg-card">
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

            {/* Favorite Button - Top Left */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleFavorite}
                  disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center transition-all z-10 hover:scale-110"
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors ${
                      isFavorite
                        ? "fill-red-500 text-red-500"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? t("product_card.tooltip.remove_from_favorites") : t("product_card.tooltip.add_to_favorites")}
              </TooltipContent>
            </Tooltip>

            {/* Add to Cart Button - Top Right */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addToCartMutation.isPending}
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                    isOutOfStock
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      : "bg-primary hover:bg-primary/90 text-white hover:scale-105"
                  }`}
                >
                  {addToCartMutation.isPending ? (
                    <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="text-sm font-bold">+</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {t("product_card.tooltip.add_to_cart")}
              </TooltipContent>
            </Tooltip>

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
                {formatPrice(displayPrice, product.currency)}
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

      {/* Minimum Quantity Dialog */}
      <MinimumQuantityDialog
        open={showMinQuantityDialog}
        onOpenChange={setShowMinQuantityDialog}
        minQuantity={minQuantityError || 1}
        productName={product.name}
        loading={isAddingMinQuantity}
        onConfirm={handleAddMinQuantity}
      />
    </>
  );
}
