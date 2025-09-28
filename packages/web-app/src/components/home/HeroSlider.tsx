"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

  const sliderImages = [
    {
      id: 1,
      src: "/images/hero-1.jpg",
      alt: "Metropolitan Food Group - Kaliteli Gıda Ürünleri",
      titleKey: "hero.title_1",
      subtitleKey: "hero.subtitle_1"
    },
    {
      id: 2,
      src: "/images/hero-2.jpg",
      alt: "Metropolitan Food Group - Hızlı Teslimat",
      titleKey: "hero.title_2",
      subtitleKey: "hero.subtitle_2"
    },
    {
      id: 3,
      src: "/images/hero-3.jpg",
      alt: "Metropolitan Food Group - Güvenilir Alışveriş",
      titleKey: "hero.title_3",
      subtitleKey: "hero.subtitle_3"
    }
  ];

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(
      () =>
        setActiveIndex((prevIndex) =>
          prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1
        ),
      3000
    );

    return () => {
      resetTimeout();
    };
  }, [activeIndex]);

  const goToPrevious = () => {
    setActiveIndex(activeIndex === 0 ? sliderImages.length - 1 : activeIndex - 1);
  };

  const goToNext = () => {
    setActiveIndex(activeIndex === sliderImages.length - 1 ? 0 : activeIndex + 1);
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="relative w-full h-[300px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl bg-muted">
      {/* Slider Images */}
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
        }}
      >
        {sliderImages.map((image) => (
          <div
            key={image.id}
            className="relative w-full h-full flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5"
          >
            {/* Placeholder for image - you can replace with actual images */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4 max-w-4xl">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
                  {t(image.titleKey)}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl opacity-90 drop-shadow-md">
                  {t(image.subtitleKey)}
                </p>
                <Button 
                  size="lg" 
                  className="mt-6 bg-white text-primary hover:bg-white/90 shadow-lg"
                >
                  {t("hero.shop_now")}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        onClick={goToNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === activeIndex
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/70"
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
