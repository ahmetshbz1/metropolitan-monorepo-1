import { useEffect, useState } from 'react';

interface Product {
  id: string;
  image: string;
  name: string;
}

const products: Product[] = [
  { id: '1', image: '/lovable-uploads/561ab381-ffd1-4c0c-badd-1ed2bc86f0d8.png', name: 'Çiğköfte' },
  { id: '2', image: '/lovable-uploads/4f60725c-2937-4caa-b637-b3b9d0f113b3.png', name: 'Vegan Lahmacun' },
  { id: '3', image: '/lovable-uploads/c5a019a3-5317-4c09-89a0-95dcf48ddd10.png', name: 'Lahmacun' },
  { id: '4', image: '/lovable-uploads/26dfa0ec-0518-41af-a10c-7642f35c29ad.png', name: 'Lahmacun 3\'lü' },
  { id: '5', image: '/lovable-uploads/f0dd450d-ca54-4da5-9183-28d0ee340b04.png', name: 'Lahmacun 5\'li' },
  { id: '6', image: '/lovable-uploads/c4a6a3bd-6159-47e3-aa07-b3a53258ea8b.png', name: 'Taş Değirmen' },
  { id: '7', image: '/lovable-uploads/be7f3899-10db-4122-b4f9-bf289f955e1c.png', name: 'Kebap Döner' },
  { id: '8', image: '/lovable-uploads/e1548891-d1ce-42b4-ab37-379a6ba71820.png', name: 'Baklavalik Yufka' },
  { id: '9', image: '/lovable-uploads/1b4973e6-6d04-44e8-8a30-42a8b62f3a4a.png', name: 'Tandır Lavaş' }
];

export const ProductCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + products.length) % products.length);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 2500);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying]);

  const getSlidePosition = (index: number) => {
    const diff = index - currentIndex;
    const totalSlides = products.length;

    // Normalize difference to be between -totalSlides/2 and totalSlides/2
    let normalizedDiff = diff;
    if (normalizedDiff > totalSlides / 2) {
      normalizedDiff -= totalSlides;
    } else if (normalizedDiff < -totalSlides / 2) {
      normalizedDiff += totalSlides;
    }

    return normalizedDiff;
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto py-8 sm:py-16">
      {/* 3D Carousel Container */}
      <div
        className="relative h-64 sm:h-96 flex items-center justify-center perspective-1000"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {products.map((product, index) => {
          const position = getSlidePosition(index);
          const isActive = position === 0;

          let transform = '';
          let zIndex = 50;
          let opacity = 0.3;
          let scale = 0.6;

          if (position === 0) {
            // Center slide
            transform = 'translateX(0) translateZ(0) rotateY(0deg)';
            zIndex = 100;
            opacity = 1;
            scale = 1;
          } else if (position === 1) {
            // Right slide
            transform = 'translateX(200px) translateZ(-200px) rotateY(-25deg)';
            zIndex = 90;
            opacity = 0.7;
            scale = 0.8;
          } else if (position === -1) {
            // Left slide
            transform = 'translateX(-200px) translateZ(-200px) rotateY(25deg)';
            zIndex = 90;
            opacity = 0.7;
            scale = 0.8;
          } else if (position === 2) {
            // Far right
            transform = 'translateX(350px) translateZ(-350px) rotateY(-45deg)';
            zIndex = 80;
            opacity = 0.4;
            scale = 0.6;
          } else if (position === -2) {
            // Far left
            transform = 'translateX(-350px) translateZ(-350px) rotateY(45deg)';
            zIndex = 80;
            opacity = 0.4;
            scale = 0.6;
          } else {
            // Hidden slides
            transform = position > 0
              ? 'translateX(500px) translateZ(-500px) rotateY(-60deg)'
              : 'translateX(-500px) translateZ(-500px) rotateY(60deg)';
            zIndex = 70;
            opacity = 0;
            scale = 0.5;
          }

          return (
            <div
              key={product.id}
              className="absolute transition-all duration-700 ease-out cursor-pointer"
              style={{
                transform: `${transform} scale(${scale})`,
                zIndex,
                opacity,
                transformStyle: 'preserve-3d',
              }}
              onClick={() => setCurrentIndex(index)}
            >
              <div className="bg-card rounded-xl shadow-2xl p-4 sm:p-6 w-56 sm:w-72 h-64 sm:h-80 flex flex-col items-center justify-center hover:shadow-3xl transition-shadow duration-300">
                <div className="w-32 h-32 sm:w-48 sm:h-48 mb-3 sm:mb-4 overflow-hidden rounded-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-center text-foreground">
                  {product.name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
