"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCategories } from "@/hooks/api";
import { Icon } from "@iconify/react";
import { ChevronDown, Package } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

const getCategoryIcon = (slug: string) => {
  const iconMap: Record<string, string> = {
    meat: "solar:meat-line-duotone",
    dairy: "solar:cup-paper-line-duotone",
    fruits: "solar:leaf-line-duotone",
    frozen: "solar:snowflake-line-duotone",
    bakery: "solar:cake-line-duotone",
    snacks: "solar:popcorn-line-duotone",
    beverages: "solar:bottle-line-duotone",
    spices: "solar:spice-line-duotone",
  };
  return iconMap[slug] || "solar:box-line-duotone";
};

export function CategoryMenu() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <Button
        variant="ghost"
        className="flex items-center gap-2 font-medium"
        disabled
      >
        <Package className="h-4 w-4" />
        <span suppressHydrationWarning>Categories</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 font-medium hover:bg-primary/10"
        >
          <Package className="h-4 w-4" />
          {t("navbar.categories")}
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
              <Link href={`/products?category=${category.slug}`}>
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
                <span className="text-sm text-primary">{t("navbar.all_categories")}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
