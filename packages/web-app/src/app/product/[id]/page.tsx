"use client";

import { ProductCard } from "@/components/product/ProductCard";
import ProductDetailTabs from "@/components/product/ProductDetailTabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Lens } from "@/components/ui/lens";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProducts } from "@/hooks/api/use-products";
import { useAddFavorite, useFavoriteIds, useRemoveFavorite } from "@/hooks/api/use-favorites";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useAddToCart, useCart, useUpdateCartItem } from "@/hooks/api/use-cart";
import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/stores";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const storeUser = useAuthStore((state) => state.user);
  const { data: products = [], isLoading: loadingProducts } = useProducts();

  console.log('👤 User Debug:', {
    contextUser: user,
    storeUser: storeUser,
    contextUserType: user?.userType,
    storeUserType: storeUser?.userType
  });

  // Favorites
  useFavoriteIds(); // Load favorites from backend
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  // Cart
  const addToCartMutation = useAddToCart();
  const updateCartMutation = useUpdateCartItem();
  const { data: cartData } = useCart();

  // Get product by ID
  const product = useMemo(() =>
    products.find(p => p.id === params.id as string),
    [products, params.id]
  );

  // Calculate minimum quantity based on user type
  const minQuantity = useMemo(() => {
    if (!product) return 1;
    // Use storeUser as fallback since context user might be null
    const currentUser = user || storeUser;
    const userType = currentUser?.userType || 'individual';
    const calculatedMin = userType === 'corporate'
      ? (product.minQuantityCorporate ?? 1)
      : (product.minQuantityIndividual ?? 1);

    console.log('🔢 MinQuantity Debug:', {
      user,
      storeUser,
      currentUser,
      userType,
      minQuantityCorporate: product.minQuantityCorporate,
      minQuantityIndividual: product.minQuantityIndividual,
      calculatedMin,
      productName: product.name
    });

    return calculatedMin;
  }, [product, user?.userType, storeUser?.userType]);

  // Find existing cart item for this product
  const existingCartItem = useMemo(() => {
    return cartData?.items?.find(item => item.product.id === params.id);
  }, [cartData?.items, params.id]);

  const [quantity, setQuantity] = useState(minQuantity);

  // Update quantity when cart changes or minQuantity changes
  useEffect(() => {
    if (existingCartItem) {
      setQuantity(existingCartItem.quantity);
    } else if (quantity < minQuantity) {
      setQuantity(minQuantity);
    }
  }, [existingCartItem, minQuantity]);

  const loading = loadingProducts;
  const error = !loading && !product ? t("error.product_not_found") : null;

  // Get similar products (same category, excluding current product)
  const similarProducts = useMemo(() => {
    let similar = products
      .filter((p) => p.id !== params.id && p.category === product?.category)
      .slice(0, 8);

    // If no products in same category, get random other products
    if (similar.length === 0) {
      similar = products.filter((p) => p.id !== params.id).slice(0, 8);
    }

    return similar;
  }, [products, params.id, product?.category]);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;

    try {
      if (existingCartItem) {
        // Update existing cart item
        await updateCartMutation.mutateAsync({
          productId: product.id,
          quantity: quantity,
        });
      } else {
        // Add new item to cart
        await addToCartMutation.mutateAsync({
          productId: product.id,
          quantity: quantity,
        });
      }
    } catch (error) {
      console.error("Error adding/updating cart:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!product?.id) return;

    try {
      const isCurrentlyFavorite = isFavorite(product.id);

      if (isCurrentlyFavorite) {
        await removeFavoriteMutation.mutateAsync(product.id);
      } else {
        await addFavoriteMutation.mutateAsync(product.id);
      }
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    const locale = currency === "PLN" ? "pl-PL" : "tr-TR";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(price);
  };

  const increaseQuantity = useCallback(() => {
    console.log('➕ Increase clicked:', { currentQuantity: quantity, minQuantity, willAdd: minQuantity });
    if (product && quantity < product.stock) {
      const newQuantity = quantity + minQuantity;
      console.log('➕ New quantity will be:', newQuantity);
      // Don't exceed stock
      if (newQuantity <= product.stock) {
        setQuantity(newQuantity);
      } else {
        setQuantity(product.stock);
      }
    }
  }, [product, quantity, minQuantity]);

  const decreaseQuantity = useCallback(() => {
    if (quantity > minQuantity) {
      setQuantity(quantity - minQuantity);
    }
  }, [quantity, minQuantity]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input for better UX while typing
    if (value === '') {
      setQuantity(minQuantity);
      return;
    }

    const numValue = parseInt(value, 10);

    // Validate input
    if (!isNaN(numValue)) {
      if (numValue < minQuantity) {
        setQuantity(minQuantity);
      } else if (product && numValue > product.stock) {
        setQuantity(product.stock);
      } else {
        // Round to nearest multiple of minQuantity
        const remainder = numValue % minQuantity;
        if (remainder === 0) {
          setQuantity(numValue);
        } else {
          // Round down to nearest multiple
          const roundedValue = numValue - remainder;
          setQuantity(roundedValue > 0 ? roundedValue : minQuantity);
        }
      }
    }
  }, [product, minQuantity]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="animate-pulse">
            {/* Back button skeleton */}
            <div className="h-10 w-24 bg-muted rounded-lg mb-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image skeleton */}
              <div className="space-y-3">
                <div className="w-full max-w-sm mx-auto">
                  <div className="aspect-square bg-muted rounded-xl"></div>
                </div>
              </div>

              {/* Content skeleton */}
              <div className="space-y-3">
                {/* Title & Category */}
                <div className="space-y-2">
                  <div className="h-7 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>

                {/* Price */}
                <div className="h-8 bg-muted rounded-lg w-1/3"></div>

                {/* Stock status */}
                <div className="h-5 bg-muted rounded-full w-24"></div>

                {/* Quantity selector */}
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-12"></div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-24 bg-muted rounded-lg"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <div className="h-12 bg-muted rounded-lg flex-1"></div>
                  <div className="h-12 w-12 bg-muted rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t("error.product_not_found")}
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.go_back")}
          </Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 hover:bg-muted"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Image */}
          <div className="space-y-3">
            <div className="w-full max-w-sm mx-auto">
              <AspectRatio
                ratio={1}
                className="bg-muted rounded-xl overflow-hidden"
              >
                {product.image ? (
                  <Lens zoomFactor={2} lensSize={160}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </Lens>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="w-24 h-24 bg-muted-foreground/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <div className="w-12 h-12 bg-muted-foreground/30 rounded-lg"></div>
                      </div>
                      <p className="text-sm">{t("product.no_image")}</p>
                    </div>
                  </div>
                )}
              </AspectRatio>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-3">
            {/* Title & Category */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {product.name}
              </h1>
              <p className="text-muted-foreground">{product.category}</p>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice, product.currency)}
                  </span>
                )}
            </div>

            {/* Stock Status */}
            <div>
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {t("product.out_of_stock")}
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  {t("product.low_stock", { count: product.stock })}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {t("product.in_stock")}
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("product.quantity")}
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-muted rounded-lg">
                    <motion.button
                      onClick={decreaseQuantity}
                      disabled={quantity <= minQuantity}
                      className="p-2 hover:bg-muted-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      <Minus className="w-3 h-3" />
                    </motion.button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={handleQuantityChange}
                      min={minQuantity}
                      max={product.stock}
                      step={minQuantity}
                      className="w-16 px-2 py-2 font-medium text-center text-sm bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <motion.button
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                      className="p-2 hover:bg-muted-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </motion.button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t("product.max_stock", { count: product.stock })}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addToCartMutation.isPending || updateCartMutation.isPending}
                size="lg"
                className="flex-1"
              >
                {(addToCartMutation.isPending || updateCartMutation.isPending) ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-5 w-5" />
                )}
                {isOutOfStock
                  ? t("product.out_of_stock")
                  : existingCartItem
                  ? t("product.update_cart")
                  : t("product.add_to_cart")}
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleFavorite}
                    disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                    className={product && isFavorite(product.id) ? "text-red-500 border-red-200" : ""}
                  >
                    {(addFavoriteMutation.isPending || removeFavoriteMutation.isPending) ? (
                      <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : (
                      <Heart
                        className={`w-5 h-5 ${product && isFavorite(product.id) ? "fill-current" : ""}`}
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="hidden md:block">
                  <p>{product && isFavorite(product.id) ? t("favorites_action.remove") : t("favorites_action.add")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-8 pt-8 border-t border-border">
            <h2 className="text-xl font-bold mb-4">
              {products.filter(
                (p) => p.id !== params.id && p.category === product?.category
              ).length > 0
                ? t("product.similar_products")
                : t("home.featured_products")}
            </h2>
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-4" style={{ width: "max-content" }}>
                {similarProducts.map((similarProduct) => (
                  <div key={similarProduct.id} className="w-32 flex-shrink-0">
                    <ProductCard product={similarProduct} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <ProductDetailTabs product={product} />
      </div>
    </div>
  );
}
