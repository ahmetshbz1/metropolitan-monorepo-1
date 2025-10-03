"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdateCartItem, useRemoveFromCart } from "@/hooks/api/use-cart";
import { useProducts } from "@/hooks/api/use-products";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

interface CartStepProps {
  onNext: () => void;
  canProceed: boolean;
  onClose?: () => void;
}

export function CartStep({ onNext, canProceed, onClose }: CartStepProps) {
  const items = useCartStore((state) => state.items);
  const summary = useCartStore((state) => state.summary);
  const isGuest = useAuthStore((state) => state.isGuest);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const router = useRouter();
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveFromCart();

  // Kullanıcı authenticated mi kontrol et
  const isAuthenticated = !!(user && accessToken);

  // Frontend'deki tüm ürünleri al
  const { data: products = [] } = useProducts();

  // Sepetteki itemlara frontend'deki product bilgilerini merge et
  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const frontendProduct = products.find((p) => p.id === item.product.id);
      console.log('🔍 Product merge:', {
        itemProductId: item.product.id,
        foundFrontendProduct: !!frontendProduct,
        frontendMinCorporate: frontendProduct?.minQuantityCorporate,
        frontendMinIndividual: frontendProduct?.minQuantityIndividual,
        backendMinCorporate: item.product.minQuantityCorporate,
        backendMinIndividual: item.product.minQuantityIndividual
      });
      return {
        ...item,
        product: frontendProduct ? {
          ...item.product,
          ...frontendProduct,
        } : item.product,
      };
    });
  }, [items, products]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Get minimum quantity for a product based on user type
  const getMinQuantity = (product: any) => {
    const userType = user?.userType || 'individual';
    const calculatedMin = userType === 'corporate'
      ? (product.minQuantityCorporate ?? 1)
      : (product.minQuantityIndividual ?? 1);
    return calculatedMin;
  };

  const handleUpdateQuantity = async (itemId: string, productId: string, newQuantity: number, minQuantity: number) => {
    if (newQuantity < minQuantity) return;
    await updateItemMutation.mutateAsync({
      itemId,
      quantity: newQuantity,
      productId,
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItemMutation.mutateAsync(itemId);
  };

  if (enrichedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Sepetiniz Boş</h3>
        <p className="text-muted-foreground">Alışverişe başlamak için ürünleri sepete ekleyin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Cart Items - Grid Layout */}
      <div className="overflow-y-auto flex-1 min-h-0 px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {enrichedItems.map((item) => {
            const minQuantity = getMinQuantity(item.product);
            console.log('🛒 Cart item:', {
              productId: item.product.id,
              name: item.product.name,
              userType: user?.userType,
              minQuantityCorporate: item.product.minQuantityCorporate,
              minQuantityIndividual: item.product.minQuantityIndividual,
              calculatedMinQuantity: minQuantity
            });

            return (
              <div
                key={item.id}
                className="group relative bg-card rounded-lg border border-border p-3 transition-all hover:shadow-md hover:border-primary/30"
              >
                {/* Delete Button - Top Right */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive z-10"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={removeItemMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="flex gap-3">
                  {/* Product Image */}
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted/50 flex-shrink-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 mb-0.5 pr-6">{item.product.name}</h4>
                    {item.product.size && (
                      <p className="text-xs text-muted-foreground mb-2">{item.product.size}</p>
                    )}

                    {/* Price */}
                    <div className="font-semibold text-sm text-primary mb-2">
                      {formatPrice(item.product.price * item.quantity, item.product.currency)}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={() => handleUpdateQuantity(item.id, item.product.id, item.quantity - minQuantity, minQuantity)}
                        disabled={item.quantity <= minQuantity || updateItemMutation.isPending}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={() => handleUpdateQuantity(item.id, item.product.id, item.quantity + minQuantity, minQuantity)}
                        disabled={
                          item.quantity + minQuantity > item.product.stock || updateItemMutation.isPending
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with Summary */}
      {summary && (
        <div className="border-t px-4 py-3 space-y-3 flex-shrink-0 bg-background">
          {/* Summary */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Toplam Ürün:</span>
              <span className="font-medium">{summary.totalItems} Adet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Ara Toplam:</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(
                  typeof summary.totalAmount === "string"
                    ? parseFloat(summary.totalAmount)
                    : summary.totalAmount,
                  summary.currency ?? "PLN"
                )}
              </span>
            </div>
          </div>

          {/* Next Button */}
          <Button
            onClick={() => {
              if (!isAuthenticated) {
                onClose?.();
                router.push("/auth/phone-login?returnToCart=true");
              } else {
                onNext();
              }
            }}
            size="lg"
            className="w-full"
            disabled={!canProceed}
          >
            {!isAuthenticated ? "Giriş Yap" : "Devam Et"}
          </Button>
        </div>
      )}
    </div>
  );
}