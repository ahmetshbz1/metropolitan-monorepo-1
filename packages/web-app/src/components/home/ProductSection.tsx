"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { Product } from "@metropolitan/shared";

interface ProductSectionProps {
  title: string;
  products: Product[];
  variant?: "grid" | "horizontal";
}

export function ProductSection({ 
  title, 
  products, 
  variant = "horizontal" 
}: ProductSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ürün yoksa bölümü gösterme
  if (!products || products.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 140; // Updated for new card width (128px + 12px gap)
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth"
      });
    }
  };

  if (variant === "grid") {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">{title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Horizontal variant (default)
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          
          {/* Navigation Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Products Horizontal Scroll */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-4"
            style={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}
          >
            {products.map((product) => (
              <div key={product.id} style={{ scrollSnapAlign: "start" }}>
                <ProductCard
                  product={product}
                  variant="horizontal"
                />
              </div>
            ))}
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="md:hidden flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll("right")}
            >
              Sonraki
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
