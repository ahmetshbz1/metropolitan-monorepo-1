"use client";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/ui/notifications-dropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { useCurrentUser, useLogout } from "@/hooks/api";
import { useCart } from "@/hooks/api/use-cart";
import { useFavorites } from "@/hooks/api/use-favorites";
import { useOrders } from "@/hooks/api/use-orders";
import { useAuthInit } from "@/hooks/use-auth-init";
import { useHydration } from "@/hooks/use-hydration";
import { useAuthStore } from "@/stores";
import { useCartStore } from "@/stores/cart-store";
import { Menu, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CategoryMenu } from "./navbar/CategoryMenu";
import { MobileMenu } from "./navbar/MobileMenu";
import { SearchBar } from "./navbar/SearchBar";

export function Navbar() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Wait for client-side hydration
  const hydrated = useHydration();

  // Initialize auth from localStorage (like mobile-app does)
  useAuthInit();

  const { user, accessToken, _hasHydrated, isGuest, guestId } = useAuthStore();
  const logout = useLogout();

  // Direct authentication check (isAuthenticated getter is not reactive in Zustand)
  const isAuthenticated = !!(user && accessToken);

  // Sepet göstermek için user veya guest olması yeterli
  const hasSession = isAuthenticated || (isGuest && guestId);

  // Fetch user profile when authenticated (auto-enabled when accessToken exists)
  useCurrentUser();

  // Fetch cart data when authenticated or guest
  const { isLoading: cartLoading } = useCart();

  // Get cart summary for display (directly access summary for reactivity)
  const cartSummary = useCartStore((state) => state.summary);

  // Fetch favorites and orders data - only for authenticated users
  const { data: favoritesData } = useFavorites();
  const { data: ordersData } = useOrders(isAuthenticated && _hasHydrated);

  // Calculate counts
  const favoritesCount = favoritesData?.length || 0;
  const ordersCount = ordersData?.length || 0;

  // Check if user came from cart after authentication
  useEffect(() => {
    if (hydrated && _hasHydrated && hasSession) {
      const openCart = searchParams.get("openCart") === "true";
      if (openCart) {
        // Open cart after auth
        setIsCartOpen(true);
        // Remove query param from URL
        router.replace("/");
      }
    }
  }, [hydrated, _hasHydrated, hasSession, searchParams, router]);

  // Yasal sayfalarda navbar'ı gösterme
  const legalPages = ["/legal", "/privacy-policy", "/terms-of-service", "/cookie-policy"];
  if (legalPages.includes(pathname)) {
    return null;
  }

  // Show loading state for dynamic content only
  const isLoading = !hydrated || !_hasHydrated;

  const handleUserAction = (action: string, route?: string) => {
    if (action === "logout") {
      logout.mutate();
    } else if (route) {
      router.push(route);
    }
  };

  const handleLogin = () => {
    router.push("/auth/phone-login");
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-background border-b border-border/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* First Row - Main Navigation */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image
                  src="/icooon.png"
                  alt="Metropolitan Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <CategoryMenu />
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <SearchBar />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <>
                  {isAuthenticated && (
                    <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
                  )}
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                </>
              ) : (
                <>
                  {isAuthenticated && <NotificationsDropdown />}
                  <UserDropdown
                    user={
                      isAuthenticated && user
                        ? {
                            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                            username: user.phone || user.phoneNumber || "",
                            email: user.email || "",
                            avatar: user.profilePhotoUrl || "",
                            initials: `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`,
                            isGuest: false,
                            userType: user.userType,
                          }
                        : undefined
                    }
                    favoritesCount={favoritesCount}
                    ordersCount={ordersCount}
                    onAction={handleUserAction}
                    onLogin={handleLogin}
                  />
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Second Row - Cart Button under profile */}
          {(hasSession || isLoading) && (
            <div className="pb-2">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-end -mr-4 sm:-mr-6 lg:-mr-8">
                  {isLoading || cartLoading ? (
                    // Skeleton loader while cart is loading
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200/50 dark:border-orange-800/50">
                      <div className="h-4 w-16 bg-orange-200/50 dark:bg-orange-800/50 rounded animate-pulse" />
                      <div className="h-4 w-4 bg-orange-200/50 dark:bg-orange-800/50 rounded animate-pulse" />
                    </div>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setIsCartOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 transition-colors border border-orange-200 dark:border-orange-800"
                        >
                          <span className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                            {formatPrice(
                              typeof cartSummary?.totalAmount === "string"
                                ? parseFloat(cartSummary.totalAmount)
                                : (cartSummary?.totalAmount ?? 0),
                              cartSummary?.currency ?? "PLN"
                            )}
                          </span>
                          <ShoppingBag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t("navbar.view_cart")}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          )}

          <MobileMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />
        </div>
      </nav>

      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
