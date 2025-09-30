"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
} from "@/hooks/api/use-cart";
import { Minus, Plus, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function CartPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, getTotalPrice } = useCartStore();

  // Cart hooks
  const { isLoading: cartLoading } = useCart();
  const updateCartMutation = useUpdateCartItem();
  const removeCartMutation = useRemoveFromCart();

  const handleCheckout = () => {
    router.push("/checkout/address");
  };

  const handleUpdateQuantity = async (
    itemId: string,
    productId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    try {
      await updateCartMutation.mutateAsync({
        itemId,
        quantity: newQuantity,
        productId, // Guest için gerekli
      });
    } catch (error) {
      console.error("Error updating cart item:", error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeCartMutation.mutateAsync(itemId);
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("cart.empty.title") || "Sepetiniz boş"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("cart.empty.subtitle") || "Alışverişe başlamak için ürün ekleyin"}
          </p>
          <Button asChild>
            <Link href="/products">
              {t("cart.empty.button") || "Ürünlere Göz At"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, currency = "PLN") => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">
          {t("cart.title") || "Sepetim"}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-xl border border-border p-4 flex gap-4"
              >
                {/* Product Image */}
                <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product?.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-muted-foreground/20 rounded-lg"></div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.product?.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatPrice(
                      item.product?.price || 0,
                      item.product?.currency
                    )}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.id,
                            item.product.id,
                            item.quantity - 1
                          )
                        }
                        disabled={
                          item.quantity <= 1 || updateCartMutation.isPending
                        }
                        className="p-2 hover:bg-muted-foreground/10 disabled:opacity-50 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 font-medium min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.id,
                            item.product.id,
                            item.quantity + 1
                          )
                        }
                        disabled={updateCartMutation.isPending}
                        className="p-2 hover:bg-muted-foreground/10 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removeCartMutation.isPending}
                      className="text-red-500 hover:text-red-600 p-2 disabled:opacity-50"
                    >
                      {removeCartMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatPrice(
                      (item.product?.price || 0) * item.quantity,
                      item.product?.currency
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">
                {t("checkout.order_summary") || "Sipariş Özeti"}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("checkout.subtotal") || "Alt Toplam"}
                  </span>
                  <span className="font-medium">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("checkout.shipping") || "Kargo"}
                  </span>
                  <span className="font-medium text-green-600">
                    {t("checkout.free") || "Ücretsiz"}
                  </span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      {t("checkout.total") || "Toplam"}
                    </span>
                    <span className="font-bold text-xl text-primary">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={handleCheckout} size="lg" className="w-full">
                {t("cart.checkout") || "Ödemeye Geç"}
              </Button>

              <div className="mt-4 text-center">
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  ← {t("cart.continue_shopping") || "Alışverişe devam et"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}