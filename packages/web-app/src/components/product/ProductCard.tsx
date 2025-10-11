"use client";

import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Product } from "@metropolitan/shared";
import { useTranslation } from "react-i18next";
import { useAddToCart } from "@/hooks/api/use-cart";
import { useAddFavorite, useRemoveFavorite, useFavoriteIds } from "@/hooks/api/use-favorites";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useAuthStore } from "@/stores";
import { useState } from "react";
import { MinimumQuantityDialog } from "./MinimumQuantityDialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "horizontal";
}

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const addToCartMutation = useAddToCart();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  const user = useAuthStore((state) => state.user);

  const [showMinQuantityDialog, setShowMinQuantityDialog] = useState(false);
  const [minQuantityError, setMinQuantityError] = useState<number | null>(null);
  const [isAddingMinQuantity, setIsAddingMinQuantity] = useState(false);

  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const isFavorite = favoriteIds.includes(product.id);

  useFavoriteIds();

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { key?: string; params?: { minQuantity?: number } } } };
      const errorPayload = err.response?.data;
      const key = errorPayload?.key;

      if (key === "MIN_QUANTITY_NOT_MET" && errorPayload.params?.minQuantity) {
        const minQty = errorPayload.params.minQuantity;
        setMinQuantityError(minQty);
        setShowMinQuantityDialog(true);
      }
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
          <div className="w-36 sm:w-40 h-72 sm:h-80 flex-shrink-0 bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border flex flex-col cursor-pointer group">
            <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-muted-foreground/10 rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg"></div>
                  </div>
                </div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleFavorite}
                    disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                    className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm flex items-center justify-center transition-all z-10 hover:scale-110 shadow-lg"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || addToCartMutation.isPending}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 shadow-lg ${
                      isOutOfStock
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90 text-white hover:scale-110"
                    }`}
                  >
                    {addToCartMutation.isPending ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("product_card.tooltip.add_to_cart")}
                </TooltipContent>
              </Tooltip>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-white/95 text-gray-900 px-3 py-1.5 rounded-lg text-sm font-semibold">
                    {t("product.out_of_stock")}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 flex-1 flex flex-col">
              <div className="mb-2">
                <span className="font-bold text-lg text-primary">
                  {formatPrice(displayPrice, product.currency)}
                </span>
              </div>

              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-primary transition-colors mb-2 leading-snug flex-1">
                {product.name}
              </h3>

              <div className="mt-auto space-y-1">
                {product.size && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {product.size}
                  </div>
                )}

                {isLowStock && !isOutOfStock && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Son {product.stock}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>

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

  return (
    <>
      <Link href={`/product/${product.id}`} className="block">
        <div className="w-36 sm:w-40 h-72 sm:h-80 bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border flex flex-col cursor-pointer group">
          <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 bg-muted-foreground/10 rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg"></div>
                </div>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleFavorite}
                  disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm flex items-center justify-center transition-all z-10 hover:scale-110 shadow-lg"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
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

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addToCartMutation.isPending}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 shadow-lg ${
                    isOutOfStock
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90 text-white hover:scale-110"
                  }`}
                >
                  {addToCartMutation.isPending ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {t("product_card.tooltip.add_to_cart")}
              </TooltipContent>
            </Tooltip>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white/95 text-gray-900 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {t("product.out_of_stock")}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 flex-1 flex flex-col">
            <div className="mb-2">
              <span className="font-bold text-lg text-primary">
                {formatPrice(displayPrice, product.currency)}
              </span>
            </div>

            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-primary transition-colors mb-2 leading-snug flex-1">
              {product.name}
            </h3>

            <div className="mt-auto space-y-1">
              {product.size && (
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {product.size}
                </div>
              )}

              {isLowStock && !isOutOfStock && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Son {product.stock}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

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
