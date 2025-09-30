"use client";

import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/ui/notifications-dropdown";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { useCurrentUser, useLogout } from "@/hooks/api";
import { useAuthInit } from "@/hooks/use-auth-init";
import { useHydration } from "@/hooks/use-hydration";
import { useAuthStore } from "@/stores";
import { useCartStore } from "@/stores/cart-store";
import { useCart } from "@/hooks/api/use-cart";
import { Menu, Sparkles, Truck, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { CategoryMenu } from "./navbar/CategoryMenu";
import { MobileMenu } from "./navbar/MobileMenu";
import { SearchBar } from "./navbar/SearchBar";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Wait for client-side hydration
  const hydrated = useHydration();

  // Initialize auth from localStorage (like mobile-app does)
  useAuthInit();

  const { user, accessToken, _hasHydrated } = useAuthStore();
  const logout = useLogout();

  // Direct authentication check (isAuthenticated getter is not reactive in Zustand)
  const isAuthenticated = !!(user && accessToken);

  // Fetch user profile when authenticated (auto-enabled when accessToken exists)
  useCurrentUser();

  // Fetch cart data when authenticated
  useCart();

  // Get cart summary for display
  const cartSummary = useCartStore((state) => state.summary);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  // Legal sayfasında navbar'ı gösterme
  if (pathname === "/legal") {
    return null;
  }

  // Show nothing until both Next.js and auth are hydrated
  if (!hydrated || !_hasHydrated) {
    return null;
  }

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

  const formatPrice = (price: number) => {
    const currency = cartSummary?.currency || 'PLN';
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-background border-b border-border/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

            <Button
              variant="ghost"
              className="flex items-center gap-2 font-medium hover:bg-primary/10"
              asChild
            >
              <Link href="/offers">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-orange-500">Fırsatlar</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="flex items-center gap-2 font-medium hover:bg-primary/10"
              asChild
            >
              <Link href="/fast-delivery">
                <Truck className="h-4 w-4 text-green-500" />
                <span>Hızlı Teslimat</span>
              </Link>
            </Button>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
            <SearchBar />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Cart Button */}
            {isAuthenticated && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 transition-colors border border-orange-200 dark:border-orange-800"
              >
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatPrice(getTotalPrice())}
                </span>
                <div className="relative">
                  <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </button>
            )}

            {isAuthenticated && <NotificationsDropdown />}

            <UserDropdown
              user={
                isAuthenticated && user
                  ? {
                      name: `${user.firstName} ${user.lastName}`,
                      username: user.phone || "",
                      email: user.email,
                      avatar: user.profilePhotoUrl || "",
                      initials: `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`,
                      isGuest: false,
                      userType: user.userType,
                    }
                  : undefined
              }
              onAction={handleUserAction}
              onLogin={handleLogin}
            />

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

        <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </nav>

      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
