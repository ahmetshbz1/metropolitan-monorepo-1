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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { categories, products } = useProducts();
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

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8); // Limit to 8 results

      setSearchResults(filtered);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, products]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleProductClick = (productId: string) => {
    setSearchQuery("");
    setShowSearchResults(false);
    router.push(`/product/${productId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
                  placeholder={mounted ? t("navbar.search_placeholder") : "Ara..."}
                  className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </form>

              {/* Search Results Dropdown */}
              {showSearchResults && (searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      Aranıyor...
                    </div>
                  ) : (
                    <>
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                          onClick={() => handleProductClick(product.id)}
                        >
                          <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <Package className="h-6 w-6 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{product.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-semibold text-primary">
                                {product.price.toFixed(2)} {product.currency}
                              </span>
                              {product.stock > 0 ? (
                                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                                  Stokta
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100">
                                  Tükendi
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {searchQuery.trim().length >= 2 && (
                        <div className="p-3 border-t border-border bg-muted/30">
                          <button
                            onClick={() => handleSearchSubmit({ preventDefault: () => {} } as any)}
                            className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            "{searchQuery}" için tüm sonuçları gör →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
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
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
                    placeholder={mounted ? t("navbar.search_placeholder") : "Ara..."}
                    className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </form>

                {/* Mobile Search Results */}
                {showSearchResults && (searchResults.length > 0 || isSearching) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        Aranıyor...
                      </div>
                    ) : (
                      <>
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                            onClick={() => {
                              handleProductClick(product.id);
                              setIsMenuOpen(false);
                            }}
                          >
                            <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-primary" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{product.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-semibold text-primary">
                                  {product.price.toFixed(2)} {product.currency}
                                </span>
                                {product.stock > 0 ? (
                                  <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                                    Stokta
                                  </Badge>
                                ) : (
                                  <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100">
                                    Tükendi
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {searchQuery.trim().length >= 2 && (
                          <div className="p-3 border-t border-border bg-muted/30">
                            <button
                              onClick={() => {
                                handleSearchSubmit({ preventDefault: () => {} } as any);
                                setIsMenuOpen(false);
                              }}
                              className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              "{searchQuery}" için tüm sonuçları gör →
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
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
