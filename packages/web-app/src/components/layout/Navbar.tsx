"use client";

import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { Menu, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

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
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/products"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {t("navbar.products")}
            </Link>
            <Link
              href="/categories"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {t("navbar.categories")}
            </Link>
            <Link
              href="/about"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {t("navbar.about")}
            </Link>
            <Link
              href="/contact"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {t("navbar.contact")}
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="search"
                placeholder={t("navbar.search_placeholder")}
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

            {/* User Dropdown */}
            <UserDropdown
              user={isAuthenticated && user ? {
                name: user.firstName + " " + user.lastName,
                username: user.email || user.phone,
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
                  placeholder={t("navbar.search_placeholder")}
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
