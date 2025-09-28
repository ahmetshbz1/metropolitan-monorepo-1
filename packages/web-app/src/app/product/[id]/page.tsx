"use client";

import { ProductCard } from "@/components/product/ProductCard";
import ProductDetailTabs from "@/components/product/ProductDetailTabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/context/ProductContext";
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { products, loadingProducts, getProductById } = useProducts();

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Get product from context using ID
  const product = getProductById(params.id as string);
  const loading = loadingProducts;
  const error = !loading && !product ? t("error.product_not_found") : null;

  // Get similar products (same category, excluding current product)
  let similarProducts = products
    .filter((p) => p.id !== params.id && p.category === product?.category)
    .slice(0, 8);

  // If no products in same category, get random other products
  if (similarProducts.length === 0) {
    similarProducts = products.filter((p) => p.id !== params.id).slice(0, 8);
  }

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      // TODO: Implement add to cart API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const formatPrice = (price: number, currency = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
    }).format(price);
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

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
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
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
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-muted-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-4 py-2 font-medium min-w-[40px] text-center text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                      className="p-2 hover:bg-muted-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
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
                disabled={isOutOfStock || isAddingToCart}
                size="lg"
                className="flex-1"
              >
                {isAddingToCart ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-5 w-5" />
                )}
                {isOutOfStock
                  ? t("product.out_of_stock")
                  : t("product.add_to_cart")}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={toggleFavorite}
                className={isFavorite ? "text-red-500 border-red-200" : ""}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </Button>
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
              <div className="flex gap-2 pb-4" style={{ width: "max-content" }}>
                {similarProducts.map((similarProduct) => (
                  <div key={similarProduct.id} className="w-40 flex-shrink-0">
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
