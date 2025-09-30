"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useUpdateCartItem, useRemoveFromCart } from "@/hooks/api/use-cart";
import { useProducts } from "@/hooks/api/use-products";
import { Minus, Plus, Trash2, X, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const summary = useCartStore((state) => state.summary);
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveFromCart();

  // Frontend'deki tüm ürünleri al
  const { data: products = [] } = useProducts();

  // Sepetteki itemlara frontend'deki product bilgilerini merge et
  const enrichedItems = useMemo(() => {
    return items.map(item => {
      const frontendProduct = products.find(p => p.id === item.product.id);
      return {
        ...item,
        product: frontendProduct || item.product, // Frontend'den bulunamazsa backend'den geleni kullan
      };
    });
  }, [items, products]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateItemMutation.mutateAsync({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItemMutation.mutateAsync(itemId);
  };

  const handleCheckout = () => {
    onOpenChange(false);
    router.push("/checkout");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl font-bold">Sepetim</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <DrawerBody className="flex flex-col h-[calc(80vh-140px)]">
          {enrichedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sepetiniz Boş</h3>
              <p className="text-muted-foreground mb-6">
                Alışverişe başlamak için ürünleri sepete ekleyin
              </p>
              <Button onClick={() => onOpenChange(false)}>
                Alışverişe Başla
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              {enrichedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-card rounded-lg border border-border"
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {item.product.name}
                    </h4>
                    {item.product.size && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.product.size}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {formatPrice(
                          item.product.price * item.quantity,
                          item.product.currency
                        )}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={
                            item.quantity <= 1 || updateItemMutation.isPending
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={
                            item.quantity >= item.product.stock ||
                            updateItemMutation.isPending
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeItemMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DrawerBody>

        {enrichedItems.length > 0 && summary && (
          <DrawerFooter className="border-t">
            <div className="space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Toplam Ürün:</span>
                  <span className="font-medium">{summary.totalItems} Adet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Ara Toplam:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(
                      typeof summary.totalAmount === 'string'
                        ? parseFloat(summary.totalAmount)
                        : summary.totalAmount,
                      summary.currency ?? 'PLN'
                    )}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                size="lg"
                className="w-full"
              >
                Ödemeye Geç
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}