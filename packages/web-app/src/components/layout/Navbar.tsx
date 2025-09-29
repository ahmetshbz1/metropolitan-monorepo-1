"use client";

import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import {
  Menu,
  Search,
  ShoppingCart,
  Heart,
  Package,
  Sparkles,
  Truck,
  ChevronDown
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { categories } = useProducts();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fake cart count - gerçek uygulamada context'ten gelecek
  const cartItemCount = 3;

  // Category icon mapping
  const getCategoryIcon = (slug: string) => {
    const iconMap: { [key: string]: string } = {
      'meat': 'solar:meat-line-duotone',
      'dairy': 'solar:cup-paper-line-duotone',
      'fruits': 'solar:leaf-line-duotone',
      'frozen': 'solar:snowflake-line-duotone',
      'bakery': 'solar:cake-line-duotone',
      'snacks': 'solar:popcorn-line-duotone',
      'beverages': 'solar:bottle-line-duotone',
      'spices': 'solar:spice-line-duotone',
    };
    return iconMap[slug] || 'solar:box-line-duotone';
  };

  const handleUserAction = (action: string, route?: string) => {
    if (action === "logout") {
      logout();
    } else if (route) {
      router.push(route);
    }
  };

  const handleLogin = () => {
    router.push("/auth/phone-login");
  };

  return (
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
            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 font-medium hover:bg-primary/10">
                  <Package className="h-4 w-4" />
                  Kategoriler
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 rounded-2xl p-2" align="start">
                <DropdownMenuGroup>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      className="p-2 rounded-lg cursor-pointer transition-colors font-medium"
                      asChild
                    >
                      <Link href={`/category/${category.slug}`}>
                        <span className="flex items-center gap-2">
                          <Icon
                            icon={getCategoryIcon(category.slug)}
                            className="size-4 text-gray-500 dark:text-gray-400"
                          />
                          <span className="text-sm">{category.name}</span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="p-2 rounded-lg cursor-pointer transition-colors font-medium"
                    asChild
                  >
                    <Link href="/categories">
                      <span className="flex items-center gap-2">
                        <Icon
                          icon="solar:list-line-duotone"
                          className="size-4 text-primary"
                        />
                        <span className="text-sm text-primary">Tüm Kategoriler</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Special Offers */}
            <Button variant="ghost" className="flex items-center gap-2 font-medium hover:bg-primary/10" asChild>
              <Link href="/offers">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-orange-500">Fırsatlar</span>
              </Link>
            </Button>

            {/* Fast Delivery */}
            <Button variant="ghost" className="flex items-center gap-2 font-medium hover:bg-primary/10" asChild>
              <Link href="/fast-delivery">
                <Truck className="h-4 w-4 text-green-500" />
                <span>Hızlı Teslimat</span>
              </Link>
            </Button>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="search"
                placeholder={mounted ? t("navbar.search_placeholder") : "Ara..."}
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Search Button - Mobile */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Favorites */}
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
              <Heart className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white">
                2
              </Badge>
            </Button>

            {/* Shopping Cart */}
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* User Dropdown */}
            <UserDropdown
              user={isAuthenticated && user ? {
                name: user.firstName + " " + user.lastName,
                username: user.phoneNumber,
                email: user.email,
                avatar: user.profilePicture,
                initials: user.firstName?.charAt(0) + user.lastName?.charAt(0),
                isGuest: false,
              } : undefined}
              onAction={handleUserAction}
              onLogin={handleLogin}
            />

            {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border/40 py-4">
            {/* Mobile Search */}
            <div className="px-4 mb-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="search"
                  placeholder={mounted ? t("navbar.search_placeholder") : "Ara..."}
                  className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-2 px-4">
              <Link
                href="/products"
                className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("navbar.products")}
              </Link>
              <Link
                href="/categories"
                className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("navbar.categories")}
              </Link>
              <Link
                href="/about"
                className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("navbar.about")}
              </Link>
              <Link
                href="/contact"
                className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("navbar.contact")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
