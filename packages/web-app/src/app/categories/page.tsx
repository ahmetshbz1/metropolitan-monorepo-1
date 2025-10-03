"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/api/use-products";
import { useCategories } from "@/hooks/api";
import { Package, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";

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

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categorizedProducts = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    products.forEach((product) => {
      const category = product.category || "Diğer";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });

    return grouped;
  }, [products]);

  const categoryKeys = Object.keys(categorizedProducts).sort();

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
      return products;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const selectedCategoryData = categories.find(c => c.name === selectedCategory);

  if (loadingProducts && products.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-muted rounded w-48 mb-8 animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-12">
              <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div
                    key={j}
                    className="h-64 bg-muted rounded-xl animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categoryKeys.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Henüz kategori bulunmuyor</h2>
          <p className="text-muted-foreground">
            Ürünler eklendiğinde burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header with Filter */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t("navbar.categories")}</h1>
          
          {/* Category Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {selectedCategoryData ? (
                  <>
                    <Icon
                      icon={getCategoryIcon(selectedCategoryData.slug)}
                      className="size-4"
                    />
                    <span>{selectedCategory}</span>
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    <span>Tüm Kategoriler</span>
                  </>
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-2xl p-2" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="p-2 rounded-lg cursor-pointer transition-colors font-medium"
                  onClick={() => setSelectedCategory(null)}
                >
                  <span className="flex items-center gap-2">
                    <Package className="size-4" />
                    <span className="text-sm">Tüm Kategoriler</span>
                  </span>
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    className="p-2 rounded-lg cursor-pointer transition-colors font-medium"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <span className="flex items-center gap-2">
                      <Icon
                        icon={getCategoryIcon(category.slug)}
                        className="size-4 text-gray-500 dark:text-gray-400"
                      />
                      <span className="text-sm">{category.name}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Products Grid or Categorized View */}
        {selectedCategory ? (
          // Filtered view - single category
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{selectedCategory}</h2>
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} ürün
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          // All categories view
          categoryKeys.map((category) => (
            <div key={category} id={category.toLowerCase()} className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{category}</h2>
                <span className="text-sm text-muted-foreground">
                  {categorizedProducts[category].length} ürün
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {categorizedProducts[category].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
