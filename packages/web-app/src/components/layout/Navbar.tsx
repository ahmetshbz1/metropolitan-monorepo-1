"use client";

import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/ui/notifications-dropdown";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { useCurrentUser, useLogout } from "@/hooks/api";
import { useAuthInit } from "@/hooks/use-auth-init";
import { useHydration } from "@/hooks/use-hydration";
import { useAuthStore } from "@/stores";
import { Menu, Sparkles, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryMenu } from "./navbar/CategoryMenu";
import { MobileMenu } from "./navbar/MobileMenu";
import { SearchBar } from "./navbar/SearchBar";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

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
  );
}
