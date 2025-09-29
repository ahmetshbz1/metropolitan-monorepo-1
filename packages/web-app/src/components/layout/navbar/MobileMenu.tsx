"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SearchBar } from "./SearchBar";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-background border-t border-border/40 py-4">
      {/* Mobile Search */}
      <div className="px-4 mb-4">
        <SearchBar onProductClick={onClose} />
      </div>

      {/* Mobile Navigation Links */}
      <div className="space-y-2 px-4">
        <Link
          href="/products"
          className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
          onClick={onClose}
        >
          {t("navbar.products")}
        </Link>
        <Link
          href="/categories"
          className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
          onClick={onClose}
        >
          {t("navbar.categories")}
        </Link>
        <Link
          href="/about"
          className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
          onClick={onClose}
        >
          {t("navbar.about")}
        </Link>
        <Link
          href="/contact"
          className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
          onClick={onClose}
        >
          {t("navbar.contact")}
        </Link>
      </div>
    </div>
  );
}
